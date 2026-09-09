// src/main/services/detection.ts
import sharp from 'sharp';
import { BoundingBox, DetectionColorMode, TrimDirection } from '../../shared/types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

type Edge = 'left' | 'right' | 'top' | 'bottom';

export interface DetectionOptions {
  colorMode: DetectionColorMode;
  customColorHex?: string;
  threshold: number;
  direction: TrimDirection;
  /** 背景と判定しない画素がこの割合（%）以下の行・列は、余白の一部として無視する */
  noiseTolerance: number;
}

export function hexToRgb(hex: string): Rgb {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * 指定した辺の最外周1ラインから最頻色を求める。
 * 四隅4点の平均では、辺ごとに帯の色が異なる画像（右側だけ黒帯など）で
 * どの帯の色とも一致しない中間色になり、余白を一切検出できなくなる。
 */
function sampleEdgeColor(
  data: Buffer,
  w: number,
  h: number,
  channels: number,
  edge: Edge
): Rgb {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

  const collect = (idx: number) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // 5bit へ量子化し、JPEG のノイズ程度のばらつきを同じ色として集計する
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  };

  if (edge === 'left' || edge === 'right') {
    const x = edge === 'left' ? 0 : w - 1;
    for (let y = 0; y < h; y++) {
      collect((y * w + x) * channels);
    }
  } else {
    const y = edge === 'top' ? 0 : h - 1;
    for (let x = 0; x < w; x++) {
      collect((y * w + x) * channels);
    }
  }

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) {
      best = bucket;
    }
  }
  if (!best) {
    return { r: 255, g: 255, b: 255 };
  }
  return {
    r: Math.round(best.r / best.count),
    g: Math.round(best.g / best.count),
    b: Math.round(best.b / best.count),
  };
}

function createBackgroundMatcher(
  data: Buffer,
  w: number,
  channels: number,
  colorMode: DetectionColorMode,
  threshold: number,
  background: Rgb
): (x: number, y: number) => boolean {
  return (x: number, y: number): boolean => {
    const idx = (y * w + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (colorMode === 'alpha') {
      return a <= threshold;
    }

    if (a < 15) {
      // ほぼ透明なピクセルは背景として判定
      return true;
    }

    if (colorMode === 'white') {
      return r >= 255 - threshold && g >= 255 - threshold && b >= 255 - threshold;
    }

    if (colorMode === 'black') {
      return r <= threshold && g <= threshold && b <= threshold;
    }

    const diff = Math.max(
      Math.abs(r - background.r),
      Math.abs(g - background.g),
      Math.abs(b - background.b)
    );
    return diff <= threshold;
  };
}

/**
 * 1行ぶんを走査し、背景でない画素が minPixels 個以上あれば内容ありとみなす。
 * 1画素でも内容と判定すると、帯の中のウォーターマークや圧縮ノイズで
 * 走査が止まり余白がほとんど削れなくなる。
 */
function lineHasContent(
  isBackground: (x: number, y: number) => boolean,
  fixed: number,
  length: number,
  axis: 'column' | 'row',
  minPixels: number
): boolean {
  let found = 0;
  for (let i = 0; i < length; i++) {
    const x = axis === 'column' ? fixed : i;
    const y = axis === 'column' ? i : fixed;
    if (!isBackground(x, y)) {
      found++;
      if (found >= minPixels) {
        return true;
      }
    }
  }
  return false;
}

export async function detectWhitespaceBounds(
  filePath: string,
  options: DetectionOptions
): Promise<BoundingBox> {
  const { colorMode, customColorHex = '#ffffff', threshold, direction, noiseTolerance } = options;

  const image = sharp(filePath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;

  const fixedBackground: Rgb =
    colorMode === 'custom'
      ? hexToRgb(customColorHex)
      : colorMode === 'black'
        ? { r: 0, g: 0, b: 0 }
        : { r: 255, g: 255, b: 255 };

  // corner_auto は辺ごとに帯の色が違い得るため、辺単位で背景色を決める
  const matcherFor = (edge: Edge) =>
    createBackgroundMatcher(
      data,
      w,
      channels,
      colorMode,
      threshold,
      colorMode === 'corner_auto'
        ? sampleEdgeColor(data, w, h, channels, edge)
        : fixedBackground
    );

  let left = 0;
  let right = w;
  let top = 0;
  let bottom = h;

  const minPixelsIn = (length: number) =>
    Math.max(1, Math.floor((length * noiseTolerance) / 100));
  const minInColumn = minPixelsIn(h);
  const minInRow = minPixelsIn(w);

  const scanH = direction === 'both' || direction === 'horizontal' || direction === 'left_only' || direction === 'right_only';
  const scanV = direction === 'both' || direction === 'vertical' || direction === 'top_only' || direction === 'bottom_only';

  if (scanH) {
    if (direction !== 'right_only') {
      const isBackground = matcherFor('left');
      for (let x = 0; x < w; x++) {
        if (lineHasContent(isBackground, x, h, 'column', minInColumn)) {
          left = x;
          break;
        }
      }
    }

    if (direction !== 'left_only') {
      const isBackground = matcherFor('right');
      for (let x = w - 1; x >= 0; x--) {
        if (lineHasContent(isBackground, x, h, 'column', minInColumn)) {
          right = x + 1;
          break;
        }
      }
    }
  }

  if (scanV) {
    if (direction !== 'bottom_only') {
      const isBackground = matcherFor('top');
      for (let y = 0; y < h; y++) {
        if (lineHasContent(isBackground, y, w, 'row', minInRow)) {
          top = y;
          break;
        }
      }
    }

    if (direction !== 'top_only') {
      const isBackground = matcherFor('bottom');
      for (let y = h - 1; y >= 0; y--) {
        if (lineHasContent(isBackground, y, w, 'row', minInRow)) {
          bottom = y + 1;
          break;
        }
      }
    }
  }

  left = Math.max(0, Math.min(left, w - 1));
  right = Math.max(left + 1, Math.min(right, w));
  top = Math.max(0, Math.min(top, h - 1));
  bottom = Math.max(top + 1, Math.min(bottom, h));

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

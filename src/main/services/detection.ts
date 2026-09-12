// src/main/services/detection.ts
import sharp from 'sharp';
import { BoundingBox, DetectionColorMode, TrimDirection } from '../../shared/types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

type Edge = 'left' | 'right' | 'top' | 'bottom';

/** 走査対象の矩形範囲（x1 / y1 は終端の次を指す） */
interface Region {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** 内容が見つからなかった辺は null を返し、呼び出し側でフォールバックさせる */
interface ScannedEdges {
  left: number | null;
  right: number | null;
  top: number | null;
  bottom: number | null;
}

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
 * 複数辺を渡した場合は、それらをまとめて集計した最頻色を返す。
 */
function sampleEdgeColor(
  data: Buffer,
  w: number,
  h: number,
  channels: number,
  edges: Edge | Edge[]
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

  for (const edge of Array.isArray(edges) ? edges : [edges]) {
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
 * 1ライン中の [from, to) を走査し、背景でない画素が minPixels 個以上あれば内容ありとみなす。
 * 1画素でも内容と判定すると、帯の中のウォーターマークや圧縮ノイズで
 * 走査が止まり余白がほとんど削れなくなる。
 */
function lineHasContent(
  isBackground: (x: number, y: number) => boolean,
  fixed: number,
  from: number,
  to: number,
  axis: 'column' | 'row',
  minPixels: number
): boolean {
  let found = 0;
  for (let i = from; i < to; i++) {
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

/** region の各辺から内側へ走査し、最初に内容を含む行・列を返す */
function scanEdges(
  matcherFor: (edge: Edge) => (x: number, y: number) => boolean,
  direction: TrimDirection,
  region: Region,
  minInColumn: number,
  minInRow: number
): ScannedEdges {
  const { x0, x1, y0, y1 } = region;
  const found: ScannedEdges = { left: null, right: null, top: null, bottom: null };

  const scanH =
    direction === 'both' || direction === 'horizontal' || direction === 'left_only' || direction === 'right_only';
  const scanV =
    direction === 'both' || direction === 'vertical' || direction === 'top_only' || direction === 'bottom_only';

  if (scanH) {
    if (direction !== 'right_only') {
      const isBackground = matcherFor('left');
      for (let x = x0; x < x1; x++) {
        if (lineHasContent(isBackground, x, y0, y1, 'column', minInColumn)) {
          found.left = x;
          break;
        }
      }
    }

    if (direction !== 'left_only') {
      const isBackground = matcherFor('right');
      for (let x = x1 - 1; x >= x0; x--) {
        if (lineHasContent(isBackground, x, y0, y1, 'column', minInColumn)) {
          found.right = x + 1;
          break;
        }
      }
    }
  }

  if (scanV) {
    if (direction !== 'bottom_only') {
      const isBackground = matcherFor('top');
      for (let y = y0; y < y1; y++) {
        if (lineHasContent(isBackground, y, x0, x1, 'row', minInRow)) {
          found.top = y;
          break;
        }
      }
    }

    if (direction !== 'top_only') {
      const isBackground = matcherFor('bottom');
      for (let y = y1 - 1; y >= y0; y--) {
        if (lineHasContent(isBackground, y, x0, x1, 'row', minInRow)) {
          found.bottom = y + 1;
          break;
        }
      }
    }
  }

  return found;
}

export interface DetectionResult {
  box: BoundingBox;
  /** 切り出し範囲が元画像の外へはみ出したときに埋める色 */
  background: Rgb;
  /** 埋めを透過として扱うか（alpha モード） */
  backgroundIsTransparent: boolean;
  imageWidth: number;
  imageHeight: number;
}

export async function detectWhitespaceBounds(
  filePath: string,
  options: DetectionOptions
): Promise<DetectionResult> {
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

  // corner_auto は辺ごとに帯の色が違い得るため、辺単位で背景色を決める。
  // 2パス走査で同じ辺を二度引くので、サンプリング結果は使い回す。
  const matcherCache = new Map<Edge, (x: number, y: number) => boolean>();
  const matcherFor = (edge: Edge) => {
    const cached = matcherCache.get(edge);
    if (cached) {
      return cached;
    }
    const matcher = createBackgroundMatcher(
      data,
      w,
      channels,
      colorMode,
      threshold,
      colorMode === 'corner_auto' ? sampleEdgeColor(data, w, h, channels, edge) : fixedBackground
    );
    matcherCache.set(edge, matcher);
    return matcher;
  };

  // パス1: 1画素でも内容があれば拾い、被写体の素の外接矩形を得る
  const base = scanEdges(matcherFor, direction, { x0: 0, x1: w, y0: 0, y1: h }, 1, 1);

  // パス2: ノイズ許容のしきい値を、画像全体ではなくパス1で得た内容領域に対する割合で決める。
  // 画像サイズ基準では余白が広い画像ほどしきい値だけが肥大し、被写体の端を削ってしまう。
  // 走査範囲もパス1の内容領域に限るため、広大な余白を二度走ることはない。
  let scanned = base;
  if (noiseTolerance > 0) {
    const region: Region = {
      x0: base.left ?? 0,
      x1: base.right ?? w,
      y0: base.top ?? 0,
      y1: base.bottom ?? h,
    };
    const minInColumn = Math.max(1, Math.floor(((region.y1 - region.y0) * noiseTolerance) / 100));
    const minInRow = Math.max(1, Math.floor(((region.x1 - region.x0) * noiseTolerance) / 100));
    const refined = scanEdges(matcherFor, direction, region, minInColumn, minInRow);
    // しきい値を上げた結果その辺の内容が全滅した場合は、パス1の位置へ戻す
    scanned = {
      left: refined.left ?? base.left,
      right: refined.right ?? base.right,
      top: refined.top ?? base.top,
      bottom: refined.bottom ?? base.bottom,
    };
  }

  let left = scanned.left ?? 0;
  let right = scanned.right ?? w;
  let top = scanned.top ?? 0;
  let bottom = scanned.bottom ?? h;

  left = Math.max(0, Math.min(left, w - 1));
  right = Math.max(left + 1, Math.min(right, w));
  top = Math.max(0, Math.min(top, h - 1));
  bottom = Math.max(top + 1, Math.min(bottom, h));

  return {
    box: {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    },
    // 統一サイズ指定で切り出し範囲が画像外へ出たときに埋める色。
    // corner_auto は外周4辺をまとめて集計した最頻色を使う。
    background:
      colorMode === 'corner_auto'
        ? sampleEdgeColor(data, w, h, channels, ['left', 'right', 'top', 'bottom'])
        : fixedBackground,
    backgroundIsTransparent: colorMode === 'alpha',
    imageWidth: w,
    imageHeight: h,
  };
}


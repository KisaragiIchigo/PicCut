// src/renderer/utils/canvasDetection.ts
import { BoundingBox, DetectionColorMode, TrimDirection } from '../../shared/types';
import { hexToRgb } from './colorUtils';

export function detectBoundsFromCanvas(
  img: HTMLImageElement,
  options: {
    colorMode: DetectionColorMode;
    customColorHex?: string;
    threshold: number;
    direction: TrimDirection;
  }
): BoundingBox {
  const { colorMode, customColorHex = '#ffffff', threshold, direction } = options;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  if (w <= 0 || h <= 0) {
    return { left: 0, top: 0, right: 1, bottom: 1, width: 1, height: 1 };
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { left: 0, top: 0, right: w, bottom: h, width: w, height: h };
  }

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let targetR = 255;
  let targetG = 255;
  let targetB = 255;

  if (colorMode === 'custom') {
    const rgb = hexToRgb(customColorHex);
    targetR = rgb.r;
    targetG = rgb.g;
    targetB = rgb.b;
  } else if (colorMode === 'black') {
    targetR = 0;
    targetG = 0;
    targetB = 0;
  } else if (colorMode === 'corner_auto') {
    const corners = [
      0,
      (w - 1) * 4,
      (h - 1) * w * 4,
      ((h - 1) * w + (w - 1)) * 4,
    ];
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    for (const idx of corners) {
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
    }
    targetR = Math.round(sumR / 4);
    targetG = Math.round(sumG / 4);
    targetB = Math.round(sumB / 4);
  }

  const isBackground = (x: number, y: number): boolean => {
    const idx = (y * w + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (colorMode === 'alpha') {
      return a <= threshold;
    }

    if (a < 15) {
      return true;
    }

    if (colorMode === 'white') {
      return r >= 255 - threshold && g >= 255 - threshold && b >= 255 - threshold;
    }

    if (colorMode === 'black') {
      return r <= threshold && g <= threshold && b <= threshold;
    }

    const diff = Math.max(Math.abs(r - targetR), Math.abs(g - targetG), Math.abs(b - targetB));
    return diff <= threshold;
  };

  let left = 0;
  let right = w;
  let top = 0;
  let bottom = h;

  const scanH = direction === 'both' || direction === 'horizontal' || direction === 'left_only' || direction === 'right_only';
  const scanV = direction === 'both' || direction === 'vertical' || direction === 'top_only' || direction === 'bottom_only';

  if (scanH) {
    if (direction !== 'right_only') {
      for (let x = 0; x < w; x++) {
        let hasContent = false;
        for (let y = 0; y < h; y++) {
          if (!isBackground(x, y)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          left = x;
          break;
        }
      }
    }

    if (direction !== 'left_only') {
      for (let x = w - 1; x >= 0; x--) {
        let hasContent = false;
        for (let y = 0; y < h; y++) {
          if (!isBackground(x, y)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          right = x + 1;
          break;
        }
      }
    }
  }

  if (scanV) {
    if (direction !== 'bottom_only') {
      for (let y = 0; y < h; y++) {
        let hasContent = false;
        for (let x = 0; x < w; x++) {
          if (!isBackground(x, y)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          top = y;
          break;
        }
      }
    }

    if (direction !== 'top_only') {
      for (let y = h - 1; y >= 0; y--) {
        let hasContent = false;
        for (let x = 0; x < w; x++) {
          if (!isBackground(x, y)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
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

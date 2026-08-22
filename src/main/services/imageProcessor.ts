// src/main/services/imageProcessor.ts
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  BoundingBox,
  DetectionColorMode,
  ProcessImageOptions,
  TrimDirection,
  BatchProcessProgress,
} from '../../shared/types';

export const SUPPORTED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.bmp',
  '.gif',
  '.tiff',
  '.tif',
  '.avif',
]);

export function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function scanDirectoryRecursively(dirPath: string): string[] {
  const results: string[] = [];
  try {
    const list = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of list) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'Remake' || entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        results.push(...scanDirectoryRecursively(fullPath));
      } else if (entry.isFile() && isSupportedFile(fullPath)) {
        results.push(fullPath);
      }
    }
  } catch {
    // スキャン不可フォルダはスキップ
  }
  return results;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
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

export async function detectWhitespaceBounds(
  filePath: string,
  options: {
    colorMode: DetectionColorMode;
    customColorHex?: string;
    threshold: number;
    direction: TrimDirection;
  }
): Promise<BoundingBox> {
  const { colorMode, customColorHex = '#ffffff', threshold, direction } = options;

  const image = sharp(filePath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;

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
    // 四隅のピクセルから背景色をサンプリング
    const corners = [
      0, // (0,0)
      (w - 1) * channels, // (w-1, 0)
      (h - 1) * w * channels, // (0, h-1)
      ((h - 1) * w + (w - 1)) * channels, // (w-1, h-1)
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

    // custom or corner_auto
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

export function computeOutputPath(filePath: string, options: ProcessImageOptions): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  let targetDir = dir;
  if (options.saveMode === 'remake_folder') {
    targetDir = path.join(dir, 'Remake');
  } else if (options.saveMode === 'custom_dir' && options.customOutputDir) {
    targetDir = options.customOutputDir;
  }

  let finalName = baseName;
  if (options.addSuffix && options.suffixString) {
    finalName = `${baseName}${options.suffixString}`;
  }

  let targetExt = ext;
  if (options.outputFormat === 'png') targetExt = '.png';
  else if (options.outputFormat === 'webp') targetExt = '.webp';
  else if (options.outputFormat === 'jpeg') targetExt = '.jpg';

  return path.join(targetDir, `${finalName}${targetExt}`);
}

export async function processSingleImageFile(
  options: ProcessImageOptions
): Promise<{ success: boolean; outputPath: string; outputSize: number; error?: string }> {
  const { filePath } = options;
  const outputPath = computeOutputPath(filePath, options);

  const bounds = await detectWhitespaceBounds(filePath, {
    colorMode: options.colorMode,
    customColorHex: options.customColorHex,
    threshold: options.threshold,
    direction: options.direction,
  });

  const origMeta = await sharp(filePath).metadata();
  const origW = origMeta.width || bounds.width;
  const origH = origMeta.height || bounds.height;

  let pipeline = sharp(filePath).extract({
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  });

  if (options.keepMargin && options.marginValue > 0) {
    let mw = 0;
    let mh = 0;
    if (options.marginUnit === 'percent') {
      mw = Math.round((origW * options.marginValue) / 100);
      mh = Math.round((origH * options.marginValue) / 100);
    } else {
      mw = options.marginValue;
      mh = options.marginValue;
    }

    let bg = { r: 0, g: 0, b: 0, alpha: 0 };
    if (options.marginBgMode === 'white') {
      bg = { r: 255, g: 255, b: 255, alpha: 1 };
    } else if (options.marginBgMode === 'black') {
      bg = { r: 0, g: 0, b: 0, alpha: 1 };
    } else if (options.marginBgMode === 'custom' && options.marginCustomColor) {
      const rgb = hexToRgb(options.marginCustomColor);
      bg = { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 };
    }

    pipeline = pipeline.extend({
      top: mh,
      bottom: mh,
      left: mw,
      right: mw,
      background: bg,
    });
  }

  const targetExt = path.extname(outputPath).toLowerCase();
  if (targetExt === '.jpg' || targetExt === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: options.jpegQuality || 95, mozjpeg: true });
  } else if (targetExt === '.webp') {
    pipeline = pipeline.webp({ quality: options.webpQuality || 90 });
  } else if (targetExt === '.png') {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (targetExt === '.avif') {
    pipeline = pipeline.avif({ quality: options.webpQuality || 90 });
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 一時バッファに書き出してから保存し、元ファイル上書き時のロックを回避
  const buffer = await pipeline.toBuffer();
  fs.writeFileSync(outputPath, buffer);

  return {
    success: true,
    outputPath,
    outputSize: buffer.length,
  };
}

export class BatchProcessor {
  private isCancelled = false;

  public cancel(): void {
    this.isCancelled = true;
  }

  public async run(
    filePaths: string[],
    options: ProcessImageOptions,
    onProgress: (progress: BatchProcessProgress) => void
  ): Promise<void> {
    this.isCancelled = false;
    const totalCount = filePaths.length;
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ filePath: string; error: string }> = [];

    onProgress({
      currentIndex: 0,
      totalCount,
      currentFileName: '',
      successCount: 0,
      errorCount: 0,
      isCompleted: false,
      isCancelled: false,
      errors: [],
    });

    for (let i = 0; i < filePaths.length; i++) {
      if (this.isCancelled) {
        break;
      }

      const filePath = filePaths[i];
      const fileName = path.basename(filePath);

      try {
        await processSingleImageFile({
          ...options,
          filePath,
        });
        successCount++;
      } catch (err: unknown) {
        errorCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push({ filePath, error: errMsg });
      }

      onProgress({
        currentIndex: i + 1,
        totalCount,
        currentFileName: fileName,
        successCount,
        errorCount,
        isCompleted: i + 1 === totalCount && !this.isCancelled,
        isCancelled: this.isCancelled,
        errors,
      });
    }
  }
}

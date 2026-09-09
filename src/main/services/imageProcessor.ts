// src/main/services/imageProcessor.ts
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ProcessImageOptions, BatchProcessProgress } from '../../shared/types';
import { detectWhitespaceBounds, hexToRgb } from './detection';

// 検出ロジックは detection.ts へ分離したが、既存の呼び出し元が
// imageProcessor 経由で参照しているため同じ名前で再公開する。
export { detectWhitespaceBounds };

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
    noiseTolerance: options.noiseTolerance,
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

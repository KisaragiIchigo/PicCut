// src/main/services/processing/applyOutputFormat.ts
import path from 'node:path';
import sharp from 'sharp';
import { ProcessImageOptions } from '../../../shared/types';

/** 出力パスの拡張子に応じたエンコーダと品質を適用する */
export function applyOutputFormat(
  pipeline: sharp.Sharp,
  outputPath: string,
  options: ProcessImageOptions
): sharp.Sharp {
  const targetExt = path.extname(outputPath).toLowerCase();

  if (targetExt === '.jpg' || targetExt === '.jpeg') {
    return pipeline.jpeg({ quality: options.jpegQuality || 95, mozjpeg: true });
  }
  if (targetExt === '.webp') {
    return pipeline.webp({ quality: options.webpQuality || 90 });
  }
  if (targetExt === '.png') {
    return pipeline.png({ compressionLevel: 8 });
  }
  if (targetExt === '.avif') {
    return pipeline.avif({ quality: options.webpQuality || 90 });
  }
  return pipeline;
}

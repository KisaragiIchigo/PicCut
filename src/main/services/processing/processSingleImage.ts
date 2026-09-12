// src/main/services/processing/processSingleImage.ts
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BatchPlan, ProcessImageOptions } from '../../../shared/types';
import { detectWithCache } from '../detectionCache';
import { applyExtensions, RgbaFill } from './applyExtensions';
import { applyOutputFormat } from './applyOutputFormat';
import { buildCropGeometry } from './buildCropGeometry';
import { computeOutputPath } from './outputPath';

export interface ProcessResult {
  success: boolean;
  outputPath: string;
  outputSize: number;
  error?: string;
}

export async function processSingleImageFile(
  options: ProcessImageOptions,
  /** 一括統一時のプラン。渡された場合は出力寸法をここへ合わせる */
  plan?: BatchPlan | null
): Promise<ProcessResult> {
  const { filePath } = options;
  const outputPath = computeOutputPath(filePath, options);

  const detected = await detectWithCache(filePath, {
    colorMode: options.colorMode,
    customColorHex: options.customColorHex,
    threshold: options.threshold,
    noiseTolerance: options.noiseTolerance,
    direction: options.direction,
  });

  // 位置も揃える場合のみ共通矩形で切る。サイズだけ揃える場合は、
  // 余白のある側が画像ごとに異なっても正しく削れるよう個別の検出結果で切る。
  const geometry = buildCropGeometry(
    detected.box,
    detected.imageWidth,
    detected.imageHeight,
    plan ?? null
  );

  // 検出した背景色。統一時の不足分の補填と marginBgMode: 'sampled' で共用する
  const sampledFill: RgbaFill = detected.backgroundIsTransparent
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : { ...detected.background, alpha: 1 };

  const extended = await applyExtensions(
    sharp(filePath).extract(geometry.crop),
    options,
    geometry,
    sampledFill
  );
  const pipeline = applyOutputFormat(extended.pipeline, outputPath, options);

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

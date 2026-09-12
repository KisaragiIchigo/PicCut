// src/main/services/processing/processSingleImage.ts
import fs from 'node:fs';
import path from 'node:path';
import { findPlanGroup } from '../../../shared/batchPlan';
import { BatchPlan, ProcessImageOptions } from '../../../shared/types';
import { detectWithCache } from '../detectionCache';
import { openImage } from '../imageSource';
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

  // 揃える相手は同じ判型の画像だけ。元寸法の違う画像に引っ張られて
  // 余白が足されることがないよう、自分の寸法のグループを引く。
  const group = findPlanGroup(plan, detected.imageWidth, detected.imageHeight);
  const geometry = buildCropGeometry(
    detected.box,
    detected.imageWidth,
    detected.imageHeight,
    group
  );

  // 検出した背景色。統一時の不足分の補填と marginBgMode: 'sampled' で共用する
  const sampledFill: RgbaFill = detected.backgroundIsTransparent
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : { ...detected.background, alpha: 1 };

  const extended = await applyExtensions(
    (await openImage(filePath)).extract(geometry.crop),
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

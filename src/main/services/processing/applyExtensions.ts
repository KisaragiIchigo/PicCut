// src/main/services/processing/applyExtensions.ts
import sharp from 'sharp';
import { ProcessImageOptions } from '../../../shared/types';
import { hexToRgb } from '../detection';
import { CropGeometry } from './buildCropGeometry';

export interface RgbaFill {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

const fillEquals = (a: RgbaFill, b: RgbaFill): boolean =>
  a.r === b.r && a.g === b.g && a.b === b.b && a.alpha === b.alpha;

/** marginBgMode から余白の塗り色を決める。sampled は検出した背景色に従う */
function resolveMarginFill(options: ProcessImageOptions, sampledFill: RgbaFill): RgbaFill {
  if (options.marginBgMode === 'white') {
    return { r: 255, g: 255, b: 255, alpha: 1 };
  }
  if (options.marginBgMode === 'black') {
    return { r: 0, g: 0, b: 0, alpha: 1 };
  }
  if (options.marginBgMode === 'custom' && options.marginCustomColor) {
    const rgb = hexToRgb(options.marginCustomColor);
    return { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 };
  }
  if (options.marginBgMode === 'sampled') {
    return sampledFill;
  }
  return { r: 0, g: 0, b: 0, alpha: 0 };
}

/**
 * 仕上げマージンの太さ。
 *
 * % 指定はトリミング後の短辺を基準にし、四方へ同じ太さで足す。
 * 元画像サイズ基準では余白の広い画像ほど縁だけが肥大し、元画像が縦長・横長だと
 * 被写体が正方形でも出力の比率が歪む。統一時は統一後の寸法が基準になるため、
 * 全画像で同じ太さになる。
 */
function resolveMarginSize(
  options: ProcessImageOptions,
  contentWidth: number,
  contentHeight: number
): number {
  if (!options.keepMargin || options.marginValue <= 0) {
    return 0;
  }
  if (options.marginUnit === 'percent') {
    return Math.round((Math.min(contentWidth, contentHeight) * options.marginValue) / 100);
  }
  return options.marginValue;
}

/**
 * 統一のための不足分の埋めと、仕上げマージンを外周へ足す。
 *
 * sharp の extend はパイプラインごとに一度しか適用されない。二度呼ぶと後の指定が
 * 前を打ち消してしまうため、色が同じなら1回にまとめ、異なる場合だけ間で確定させる。
 */
export async function applyExtensions(
  pipeline: sharp.Sharp,
  options: ProcessImageOptions,
  geometry: CropGeometry,
  sampledFill: RgbaFill
): Promise<{ pipeline: sharp.Sharp; width: number; height: number }> {
  const { pad } = geometry;
  const hasPad = pad.top > 0 || pad.bottom > 0 || pad.left > 0 || pad.right > 0;
  const margin = resolveMarginSize(options, geometry.width, geometry.height);

  const paddedWidth = geometry.width;
  const paddedHeight = geometry.height;
  const finalWidth = paddedWidth + margin * 2;
  const finalHeight = paddedHeight + margin * 2;

  if (!hasPad && margin <= 0) {
    return { pipeline, width: paddedWidth, height: paddedHeight };
  }

  const marginFill = resolveMarginFill(options, sampledFill);

  if (!hasPad) {
    return {
      pipeline: pipeline.extend({
        top: margin,
        bottom: margin,
        left: margin,
        right: margin,
        background: marginFill,
      }),
      width: finalWidth,
      height: finalHeight,
    };
  }

  if (margin <= 0) {
    return {
      pipeline: pipeline.extend({ ...pad, background: sampledFill }),
      width: paddedWidth,
      height: paddedHeight,
    };
  }

  if (fillEquals(sampledFill, marginFill)) {
    return {
      pipeline: pipeline.extend({
        top: pad.top + margin,
        bottom: pad.bottom + margin,
        left: pad.left + margin,
        right: pad.right + margin,
        background: marginFill,
      }),
      width: finalWidth,
      height: finalHeight,
    };
  }

  const padded = sharp(await pipeline.extend({ ...pad, background: sampledFill }).toBuffer());
  return {
    pipeline: padded.extend({
      top: margin,
      bottom: margin,
      left: margin,
      right: margin,
      background: marginFill,
    }),
    width: finalWidth,
    height: finalHeight,
  };
}

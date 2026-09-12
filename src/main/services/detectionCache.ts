// src/main/services/detectionCache.ts
import fs from 'node:fs';
import {
  DetectionOptions,
  DetectionResult,
  detectWhitespaceBounds,
} from './detection';

// プレビュー・統一プランの算出・一括処理が同じ検出を繰り返すため、結果を使い回す。
// 漫画1巻ぶん程度を保持できれば足りるので、単純な LRU で上限を設ける。
const MAX_ENTRIES = 3000;
const cache = new Map<string, DetectionResult>();

function cacheKey(filePath: string, options: DetectionOptions): string {
  let stamp = '';
  try {
    const stat = fs.statSync(filePath);
    stamp = `${stat.mtimeMs}:${stat.size}`;
  } catch {
    // 読めないファイルは検出時に例外となる。キーだけ作って先へ進める。
  }

  return [
    filePath,
    stamp,
    options.colorMode,
    options.customColorHex ?? '',
    options.threshold,
    options.noiseTolerance,
    options.direction,
  ].join('|');
}

export async function detectWithCache(
  filePath: string,
  options: DetectionOptions
): Promise<DetectionResult> {
  const key = cacheKey(filePath, options);

  const hit = cache.get(key);
  if (hit) {
    // 参照したものを末尾へ送り、最近使ったものが残るようにする
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const result = await detectWhitespaceBounds(filePath, options);
  cache.set(key, result);

  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) {
      cache.delete(oldest.value);
    }
  }

  return result;
}


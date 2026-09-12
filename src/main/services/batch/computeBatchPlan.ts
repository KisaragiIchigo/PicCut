// src/main/services/batch/computeBatchPlan.ts
import path from 'node:path';
import { BatchPlan, BoundingBox } from '../../../shared/types';
import { DetectionOptions } from '../detection';
import { detectWithCache } from '../detectionCache';
import { unionOfBoxes } from './unionOfBoxes';

export interface BatchPlanOptions extends DetectionOptions {
  /** サイズだけでなく切り出し位置も揃えるか */
  unifyCropPosition: boolean;
}

/**
 * 全画像を検出し、一括処理で共通に使う統一プランを決める。
 * 読めなかったファイルは基準から外し、本処理側で例外として一度だけ数える。
 * 検出結果はキャッシュされるため、プレビューや後続の書き出しで再利用される。
 */
export async function computeBatchPlan(
  filePaths: string[],
  options: BatchPlanOptions,
  onProgress?: (done: number, fileName: string) => void,
  shouldStop?: () => boolean
): Promise<BatchPlan | null> {
  const boxes: BoundingBox[] = [];

  for (let i = 0; i < filePaths.length; i++) {
    if (shouldStop?.()) {
      break;
    }

    const filePath = filePaths[i];
    try {
      const detected = await detectWithCache(filePath, options);
      boxes.push(detected.box);
    } catch {
      // 統一の基準から外すだけにとどめる
    }
    onProgress?.(i + 1, path.basename(filePath));
  }

  if (boxes.length === 0) {
    return null;
  }

  if (options.unifyCropPosition) {
    const shared = unionOfBoxes(boxes);
    if (!shared) {
      return null;
    }
    return {
      width: shared.width,
      height: shared.height,
      sharedBox: shared,
      analyzedCount: boxes.length,
    };
  }

  // 位置は各画像に任せ、最も大きい内容が収まる寸法へ揃える。
  // 余白のある側が画像ごとに違っても、それぞれの余白を正しく削れる。
  let width = 0;
  let height = 0;
  for (const box of boxes) {
    width = Math.max(width, box.width);
    height = Math.max(height, box.height);
  }

  return { width, height, sharedBox: null, analyzedCount: boxes.length };
}

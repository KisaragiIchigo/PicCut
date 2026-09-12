// src/main/services/batch/computeBatchPlan.ts
import path from 'node:path';
import { sourceSizeKey } from '../../../shared/batchPlan';
import { BatchPlan, BatchPlanGroup, BoundingBox } from '../../../shared/types';
import { DetectionOptions } from '../detection';
import { detectWithCache } from '../detectionCache';
import { unionOfBoxes } from './unionOfBoxes';

export interface BatchPlanOptions extends DetectionOptions {
  /** サイズだけでなく切り出し位置も揃えるか */
  unifyCropPosition: boolean;
}

/**
 * 全画像を検出し、一括処理で使う統一プランを決める。
 *
 * 判型の違う画像（表紙と本文など）を同じ寸法へ揃えると、小さい側に不要な余白が
 * 大量に足されてしまう。そのため元画像の寸法ごとにグループを分け、
 * 揃えるのは同じ判型の中だけにする。
 * 読めなかったファイルは基準から外し、本処理側で例外として一度だけ数える。
 */
export async function computeBatchPlan(
  filePaths: string[],
  options: BatchPlanOptions,
  onProgress?: (done: number, fileName: string) => void,
  shouldStop?: () => boolean
): Promise<BatchPlan | null> {
  const buckets = new Map<string, BoundingBox[]>();
  let analyzedCount = 0;

  for (let i = 0; i < filePaths.length; i++) {
    if (shouldStop?.()) {
      break;
    }

    const filePath = filePaths[i];
    try {
      const detected = await detectWithCache(filePath, options);
      const key = sourceSizeKey(detected.imageWidth, detected.imageHeight);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(detected.box);
      } else {
        buckets.set(key, [detected.box]);
      }
      analyzedCount++;
    } catch {
      // 統一の基準から外すだけにとどめる
    }
    onProgress?.(i + 1, path.basename(filePath));
  }

  if (analyzedCount === 0) {
    return null;
  }

  const groups: BatchPlanGroup[] = [];
  for (const [sourceKey, boxes] of buckets) {
    if (options.unifyCropPosition) {
      const shared = unionOfBoxes(boxes);
      if (!shared) {
        continue;
      }
      groups.push({
        sourceKey,
        width: shared.width,
        height: shared.height,
        sharedBox: shared,
        memberCount: boxes.length,
      });
      continue;
    }

    // 位置は各画像に任せ、最も大きい内容が収まる寸法へ揃える。
    // 余白のある側が画像ごとに違っても、それぞれの余白を正しく削れる。
    let width = 0;
    let height = 0;
    for (const box of boxes) {
      width = Math.max(width, box.width);
      height = Math.max(height, box.height);
    }
    groups.push({ sourceKey, width, height, sharedBox: null, memberCount: boxes.length });
  }

  if (groups.length === 0) {
    return null;
  }

  return { groups, analyzedCount };
}

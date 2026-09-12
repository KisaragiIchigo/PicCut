// src/shared/batchPlan.ts
// 統一プランの参照ヘルパ。main と renderer の双方が同じ規則でグループを引く。
import { BatchPlan, BatchPlanGroup } from './types';

/** 元画像の寸法からグループのキーを作る */
export function sourceSizeKey(width: number, height: number): string {
  return `${width}x${height}`;
}

/**
 * その画像の元寸法に対応するグループを返す。
 * 判型が違う画像は別グループなので、互いのサイズに巻き込まれない。
 */
export function findPlanGroup(
  plan: BatchPlan | null | undefined,
  imageWidth: number,
  imageHeight: number
): BatchPlanGroup | null {
  if (!plan) {
    return null;
  }
  const key = sourceSizeKey(imageWidth, imageHeight);
  return plan.groups.find((group) => group.sourceKey === key) ?? null;
}

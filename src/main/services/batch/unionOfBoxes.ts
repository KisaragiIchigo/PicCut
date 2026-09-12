// src/main/services/batch/unionOfBoxes.ts
import { BoundingBox } from '../../../shared/types';

/**
 * 複数の矩形すべてを包む最小の矩形を返す。
 * 各辺は最も外側を採るため、どの画像の内容も欠けることがない。
 */
export function unionOfBoxes(boxes: BoundingBox[]): BoundingBox | null {
  if (boxes.length === 0) {
    return null;
  }

  let left = Infinity;
  let top = Infinity;
  let right = 0;
  let bottom = 0;
  for (const box of boxes) {
    left = Math.min(left, box.left);
    top = Math.min(top, box.top);
    right = Math.max(right, box.right);
    bottom = Math.max(bottom, box.bottom);
  }

  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

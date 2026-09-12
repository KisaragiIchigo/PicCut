// src/renderer/hooks/useImageProcessor.ts
import { useCallback } from 'react';
import { findPlanGroup } from '../../shared/batchPlan';
import { AppSettings, BoundingBox } from '../../shared/types';
import { useBatchPlan } from './imageProcessor/useBatchPlan';
import { useBatchRunner } from './imageProcessor/useBatchRunner';
import { useBoundsDetection } from './imageProcessor/useBoundsDetection';
import { useImageQueue } from './imageProcessor/useImageQueue';

export function useImageProcessor(settings: AppSettings) {
  const queue = useImageQueue();
  const detection = useBoundsDetection(queue.selectedItem, settings);
  const plan = useBatchPlan(queue.items, settings);
  const runner = useBatchRunner(queue.items, queue.selectedItem, settings);

  // 選択中の画像に適用されるグループ。判型の違う画像とは統一されない
  const activeGroup = findPlanGroup(
    plan.batchPlan,
    queue.selectedItem?.dimensions?.width ?? 0,
    queue.selectedItem?.dimensions?.height ?? 0
  );

  // プレビューへ渡す枠。位置も揃える設定のときは、実際に切られる共通矩形を見せる
  const effectiveBox: BoundingBox | null = activeGroup?.sharedBox ?? detection.detectedBox;

  // 統一が効く場合の最終寸法（仕上げマージンを足す前）
  const outputSize = activeGroup
    ? { width: activeGroup.width, height: activeGroup.height }
    : detection.detectedBox
      ? { width: detection.detectedBox.width, height: detection.detectedBox.height }
      : null;

  // サイズだけ揃える場合、切り出し範囲は統一寸法の中央へ置かれる。
  // その最終的なキャンバス範囲を元画像の座標系で表し、プレビューへ重ねる。
  // 位置も揃える設定では検出枠そのものが共通矩形になるため、重ねる意味がない。
  const unifiedBox: BoundingBox | null = (() => {
    const box = detection.detectedBox;
    if (!activeGroup || activeGroup.sharedBox || !box) {
      return null;
    }
    const padLeft = Math.max(0, Math.floor((activeGroup.width - box.width) / 2));
    const padTop = Math.max(0, Math.floor((activeGroup.height - box.height) / 2));
    if (padLeft === 0 && padTop === 0) {
      return null;
    }
    const left = box.left - padLeft;
    const top = box.top - padTop;
    return {
      left,
      top,
      right: left + activeGroup.width,
      bottom: top + activeGroup.height,
      width: activeGroup.width,
      height: activeGroup.height,
    };
  })();

  const clearItems = useCallback(() => {
    queue.clearItems();
    detection.setDetectedBox(null);
  }, [queue, detection]);

  return {
    items: queue.items,
    selectedIndex: queue.selectedIndex,
    selectedItem: queue.selectedItem,
    setSelectedIndex: queue.setSelectedIndex,
    addFiles: queue.addFiles,
    pickFiles: queue.pickFiles,
    pickDirectory: queue.pickDirectory,
    clearItems,

    detectedBox: effectiveBox,
    unifiedBox,
    outputSize,
    isDetecting: detection.isDetecting,

    batchPlan: plan.batchPlan,
    activeGroup,
    isPlanning: plan.isPlanning,

    isProcessing: runner.isProcessing,
    batchProgress: runner.batchProgress,
    isBatchModalOpen: runner.isBatchModalOpen,
    setIsBatchModalOpen: runner.setIsBatchModalOpen,
    startProcessing: runner.startProcessing,
    cancelProcessing: runner.cancelProcessing,
    openOutputFolder: runner.openOutputFolder,
  };
}

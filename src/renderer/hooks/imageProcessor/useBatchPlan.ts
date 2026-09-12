// src/renderer/hooks/imageProcessor/useBatchPlan.ts
import { useEffect, useRef, useState } from 'react';
import { AppSettings, BatchPlan, ImageItem } from '../../../shared/types';

// 全画像を走査するため、1枚ぶんの検出より長めに待ってから走らせる
const PLAN_DEBOUNCE_MS = 500;

/**
 * 一括統一の基準を先に算出し、プレビューへ実際の出力寸法を反映させるためのフック。
 * 検出結果は main 側でキャッシュされるので、ここで計算したものは書き出し時に再利用される。
 */
export function useBatchPlan(items: ImageItem[], settings: AppSettings) {
  const [batchPlan, setBatchPlan] = useState<BatchPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const requestIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const {
    colorMode,
    customColorHex,
    threshold,
    noiseTolerance,
    direction,
    unifyBatchSize,
    unifyCropPosition,
  } = settings;

  // 対象ファイルの並びだけを見る。サムネイル取得による items の更新では走らせない
  const pathKey = items.map((item) => item.filePath).join('\n');

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // 走行中の結果を捨てるため、条件が変わった時点で必ず番号を進める
    const requestId = ++requestIdRef.current;
    const paths = pathKey ? pathKey.split('\n') : [];

    if (!unifyBatchSize || paths.length <= 1 || !window.electronAPI?.computeBatchPlan) {
      setBatchPlan(null);
      setIsPlanning(false);
      return;
    }

    setIsPlanning(true);
    timeoutRef.current = window.setTimeout(async () => {
      try {
        const next = await window.electronAPI!.computeBatchPlan!(paths, {
          colorMode,
          customColorHex,
          threshold,
          noiseTolerance,
          direction,
          unifyCropPosition,
        });
        if (requestId === requestIdRef.current) {
          setBatchPlan(next);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setBatchPlan(null);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsPlanning(false);
        }
      }
    }, PLAN_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [
    pathKey,
    colorMode,
    customColorHex,
    threshold,
    noiseTolerance,
    direction,
    unifyBatchSize,
    unifyCropPosition,
  ]);

  return { batchPlan, isPlanning };
}

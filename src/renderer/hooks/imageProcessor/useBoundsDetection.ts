// src/renderer/hooks/imageProcessor/useBoundsDetection.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppSettings, BoundingBox, ImageItem } from '../../../shared/types';
import { detectBoundsFromCanvas } from '../../utils/canvasDetection';

/** 選択中の1枚について余白境界を検出する。設定変更はデバウンスしてから走らせる */
export function useBoundsDetection(selectedItem: ImageItem | null, settings: AppSettings) {
  const [detectedBox, setDetectedBox] = useState<BoundingBox | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const timeoutRef = useRef<number | null>(null);

  const { colorMode, customColorHex, threshold, noiseTolerance, direction } = settings;

  const runDetection = useCallback(async () => {
    if (!selectedItem) {
      setDetectedBox(null);
      return;
    }

    setIsDetecting(true);

    try {
      if (window.electronAPI?.detectBounds) {
        const bounds = await window.electronAPI.detectBounds(selectedItem.filePath, {
          colorMode,
          customColorHex,
          threshold,
          noiseTolerance,
          direction,
        });
        setDetectedBox(bounds);
      } else {
        // ブラウザ単体でのCanvasフォールバック
        const img = new Image();
        img.src = selectedItem.previewUrl || selectedItem.filePath;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const bounds = detectBoundsFromCanvas(img, {
          colorMode,
          customColorHex,
          threshold,
          direction,
        });
        setDetectedBox(bounds);
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  }, [selectedItem, colorMode, customColorHex, threshold, noiseTolerance, direction]);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      runDetection();
    }, 150);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [runDetection]);

  return { detectedBox, isDetecting, setDetectedBox };
}

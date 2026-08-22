// src/renderer/hooks/useImageProcessor.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppSettings,
  BatchProcessProgress,
  BoundingBox,
  ImageItem,
  ProcessImageOptions,
} from '../../shared/types';
import { detectBoundsFromCanvas } from '../utils/canvasDetection';

export function useImageProcessor(settings: AppSettings) {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [detectedBox, setDetectedBox] = useState<BoundingBox | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<BatchProcessProgress | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

  const selectedItem = items[selectedIndex] || null;

  // 検出のデバウンス用
  const detectTimeoutRef = useRef<number | null>(null);

  // ファイル/フォルダの追加
  const addFiles = useCallback(async (filePaths: string[]) => {
    const newItems: ImageItem[] = [];

    for (const p of filePaths) {
      // フォルダの場合はスキャン
      let targets = [p];
      if (window.electronAPI?.scanDirectory) {
        try {
          const scanned = await window.electronAPI.scanDirectory(p);
          if (scanned && scanned.length > 0) {
            targets = scanned;
          }
        } catch {
          // 通常ファイル扱い
        }
      }

      for (const targetPath of targets) {
        const fileName = targetPath.split(/[/\\]/).pop() || targetPath;
        const id = `${targetPath}_${Date.now()}_${Math.random()}`;

        let dimensions = undefined;
        let fileSize = 0;
        let previewUrl = targetPath;

        if (window.electronAPI?.loadImageMetadata) {
          try {
            const meta = await window.electronAPI.loadImageMetadata(targetPath);
            dimensions = { width: meta.width, height: meta.height };
            fileSize = meta.size;
            if (meta.base64Preview) {
              previewUrl = meta.base64Preview;
            }
          } catch {
            // メタデータロード失敗
          }
        }

        newItems.push({
          id,
          filePath: targetPath,
          fileName,
          fileSize,
          dimensions,
          previewUrl,
          status: 'pending',
        });
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => {
        const combined = [...prev, ...newItems];
        return combined;
      });
    }
  }, []);

  // 選択アイテムの余白検出
  const runDetection = useCallback(async () => {
    if (!selectedItem) {
      setDetectedBox(null);
      return;
    }

    setIsDetecting(true);

    try {
      if (window.electronAPI?.detectBounds) {
        const bounds = await window.electronAPI.detectBounds(selectedItem.filePath, {
          colorMode: settings.colorMode,
          customColorHex: settings.customColorHex,
          threshold: settings.threshold,
          direction: settings.direction,
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
          colorMode: settings.colorMode,
          customColorHex: settings.customColorHex,
          threshold: settings.threshold,
          direction: settings.direction,
        });
        setDetectedBox(bounds);
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  }, [selectedItem, settings.colorMode, settings.customColorHex, settings.threshold, settings.direction]);

  // 設定または選択画像変更時に検出をトリガー
  useEffect(() => {
    if (detectTimeoutRef.current) {
      window.clearTimeout(detectTimeoutRef.current);
    }
    detectTimeoutRef.current = window.setTimeout(() => {
      runDetection();
    }, 150);

    return () => {
      if (detectTimeoutRef.current) {
        window.clearTimeout(detectTimeoutRef.current);
      }
    };
  }, [runDetection]);

  // IPCバッチ進捗リッスン
  useEffect(() => {
    if (!window.electronAPI?.onBatchProgress) return;

    const unsubscribe = window.electronAPI.onBatchProgress((progress) => {
      setBatchProgress(progress);
      if (progress.isCompleted || progress.isCancelled) {
        setIsProcessing(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ファイルピッカー起動
  const pickFiles = useCallback(async () => {
    if (window.electronAPI?.selectFiles) {
      const selected = await window.electronAPI.selectFiles();
      if (selected && selected.length > 0) {
        addFiles(selected);
      }
    }
  }, [addFiles]);

  // フォルダピッカー起動
  const pickDirectory = useCallback(async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        addFiles([selected]);
      }
    }
  }, [addFiles]);

  // 処理開始（単一または一括）
  const startProcessing = useCallback(async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);

    const options: ProcessImageOptions = {
      filePath: '',
      colorMode: settings.colorMode,
      customColorHex: settings.customColorHex,
      threshold: settings.threshold,
      direction: settings.direction,
      keepMargin: settings.keepMargin,
      marginUnit: settings.marginUnit,
      marginValue: settings.marginValue,
      marginBgMode: settings.marginBgMode,
      marginCustomColor: settings.marginCustomColor,
      saveMode: settings.saveMode,
      customOutputDir: settings.customOutputDir,
      outputFormat: settings.outputFormat,
      jpegQuality: settings.jpegQuality,
      webpQuality: settings.webpQuality,
      addSuffix: settings.addSuffix,
      suffixString: settings.suffixString,
    };

    if (items.length === 1 && window.electronAPI?.processSingleImage) {
      // 単一処理
      try {
        const res = await window.electronAPI.processSingleImage({
          ...options,
          filePath: items[0].filePath,
        });
        if (res.success) {
          setBatchProgress({
            currentIndex: 1,
            totalCount: 1,
            currentFileName: items[0].fileName,
            successCount: 1,
            errorCount: 0,
            isCompleted: true,
            isCancelled: false,
            errors: [],
          });
          setIsBatchModalOpen(true);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setBatchProgress({
          currentIndex: 1,
          totalCount: 1,
          currentFileName: items[0].fileName,
          successCount: 0,
          errorCount: 1,
          isCompleted: true,
          isCancelled: false,
          errors: [{ filePath: items[0].filePath, error: msg }],
        });
        setIsBatchModalOpen(true);
      } finally {
        setIsProcessing(false);
      }
    } else if (window.electronAPI?.startBatchProcess) {
      // 一括処理
      setIsBatchModalOpen(true);
      const paths = items.map((i) => i.filePath);
      await window.electronAPI.startBatchProcess(paths, options);
    }
  }, [items, isProcessing, settings]);

  // 中止
  const cancelProcessing = useCallback(async () => {
    if (window.electronAPI?.cancelBatchProcess) {
      await window.electronAPI.cancelBatchProcess();
    }
  }, []);

  // 保存先フォルダを開く
  const openOutputFolder = useCallback(async () => {
    if (!selectedItem || !window.electronAPI?.openPathInExplorer) return;
    const itemDir = selectedItem.filePath.replace(/[/\\][^/\\]+$/, '');
    let target = itemDir;
    if (settings.saveMode === 'remake_folder') {
      target = `${itemDir}/Remake`;
    } else if (settings.saveMode === 'custom_dir' && settings.customOutputDir) {
      target = settings.customOutputDir;
    }
    await window.electronAPI.openPathInExplorer(target);
  }, [selectedItem, settings.saveMode, settings.customOutputDir]);

  const clearItems = useCallback(() => {
    setItems([]);
    setSelectedIndex(0);
    setDetectedBox(null);
  }, []);

  return {
    items,
    selectedIndex,
    selectedItem,
    setSelectedIndex,
    detectedBox,
    isDetecting,
    isProcessing,
    batchProgress,
    isBatchModalOpen,
    setIsBatchModalOpen,
    addFiles,
    pickFiles,
    pickDirectory,
    startProcessing,
    cancelProcessing,
    openOutputFolder,
    clearItems,
  };
}

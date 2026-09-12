// src/renderer/hooks/imageProcessor/useBatchRunner.ts
import { useCallback, useEffect, useState } from 'react';
import { AppSettings, BatchProcessProgress, ImageItem } from '../../../shared/types';
import { buildProcessOptions } from './buildProcessOptions';

/** 処理の起動・進捗購読・中止・保存先を開く操作をまとめる */
export function useBatchRunner(items: ImageItem[], selectedItem: ImageItem | null, settings: AppSettings) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<BatchProcessProgress | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

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

  const startProcessing = useCallback(async () => {
    if (items.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const options = buildProcessOptions(settings);

    if (items.length === 1 && window.electronAPI?.processSingleImage) {
      // 単一処理。統一の基準は複数枚そろって初めて決まるため、ここでは効かない
      try {
        const res = await window.electronAPI.processSingleImage({
          ...options,
          filePath: items[0].filePath,
        });
        if (res.success) {
          setBatchProgress({
            phase: 'processing',
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
          phase: 'processing',
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
      setIsBatchModalOpen(true);
      const paths = items.map((i) => i.filePath);
      await window.electronAPI.startBatchProcess(paths, options);
    }
  }, [items, isProcessing, settings]);

  const cancelProcessing = useCallback(async () => {
    if (window.electronAPI?.cancelBatchProcess) {
      await window.electronAPI.cancelBatchProcess();
    }
  }, []);

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

  return {
    isProcessing,
    batchProgress,
    isBatchModalOpen,
    setIsBatchModalOpen,
    startProcessing,
    cancelProcessing,
    openOutputFolder,
  };
}

// src/renderer/hooks/imageProcessor/useImageQueue.ts
import { useCallback, useState } from 'react';
import { ImageItem } from '../../../shared/types';

// メタデータ取得の同時実行数。Sharp 側のスレッドプールが律速になるため増やしすぎない。
const METADATA_CONCURRENCY = 8;

export function useImageQueue() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const addFiles = useCallback(async (filePaths: string[]) => {
    // フォルダは実ファイルの一覧へ展開する。投下された各パスは独立なので並列で問い合わせる。
    const expanded = await Promise.all(
      filePaths.map(async (p) => {
        if (!window.electronAPI?.scanDirectory) return [p];
        try {
          const scanned = await window.electronAPI.scanDirectory(p);
          return scanned && scanned.length > 0 ? scanned : [p];
        } catch {
          // フォルダでなければ通常ファイルとして扱う
          return [p];
        }
      })
    );

    const targets = expanded.flat();
    if (targets.length === 0) return;

    // 寸法とサムネイルの取得を待たずに一覧へ反映する。
    // 全件そろうまで待つと、大量投入時に画面が無反応に見えてしまう。
    const stamp = Date.now();
    const placeholders: ImageItem[] = targets.map((targetPath, index) => ({
      id: `${targetPath}_${stamp}_${index}`,
      filePath: targetPath,
      fileName: targetPath.split(/[/\\]/).pop() || targetPath,
      fileSize: 0,
      previewUrl: targetPath,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...placeholders]);

    const loadMetadata = window.electronAPI?.loadImageMetadata;
    if (!loadMetadata) return;

    // 取得できたものから順に差し替える
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(METADATA_CONCURRENCY, placeholders.length) },
      async () => {
        while (cursor < placeholders.length) {
          const target = placeholders[cursor++];
          try {
            const meta = await loadMetadata(target.filePath);
            setItems((prev) =>
              prev.map((item) =>
                item.id === target.id
                  ? {
                      ...item,
                      fileSize: meta.size,
                      dimensions: { width: meta.width, height: meta.height },
                      previewUrl: meta.base64Preview || item.previewUrl,
                    }
                  : item
              )
            );
          } catch {
            // 読み込めない画像は一覧に残したまま次へ進む
          }
        }
      }
    );
    await Promise.all(workers);
  }, []);

  const pickFiles = useCallback(async () => {
    if (window.electronAPI?.selectFiles) {
      const selected = await window.electronAPI.selectFiles();
      if (selected && selected.length > 0) {
        addFiles(selected);
      }
    }
  }, [addFiles]);

  const pickDirectory = useCallback(async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        addFiles([selected]);
      }
    }
  }, [addFiles]);

  const clearItems = useCallback(() => {
    setItems([]);
    setSelectedIndex(0);
  }, []);

  return {
    items,
    selectedIndex,
    selectedItem: items[selectedIndex] || null,
    setSelectedIndex,
    addFiles,
    pickFiles,
    pickDirectory,
    clearItems,
  };
}

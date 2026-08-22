// src/renderer/hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../../shared/types';

export const DEFAULT_SETTINGS: AppSettings = {
  colorMode: 'white',
  customColorHex: '#ffffff',
  threshold: 70,
  direction: 'both',
  keepMargin: true,
  marginUnit: 'percent',
  marginValue: 5,
  marginBgMode: 'transparent',
  marginCustomColor: '#ffffff',
  saveMode: 'remake_folder',
  customOutputDir: '',
  outputFormat: 'keep_original',
  jpegQuality: 95,
  webpQuality: 90,
  addSuffix: false,
  suffixString: '_trimmed',
  winX: -1,
  winY: -1,
  winWidth: 1040,
  winHeight: 700,
  isMaximized: false,
};

const LOCAL_STORAGE_KEY = 'piccut_ultra_settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch {
      // localStorageフォールバック
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Electron API から設定を非同期ロード
  useEffect(() => {
    async function initSettings() {
      if (window.electronAPI?.loadSettings) {
        try {
          const loaded = await window.electronAPI.loadSettings();
          setSettings((prev) => ({ ...prev, ...loaded }));
        } catch {
          // ロードエラー時は既定値維持
        }
      }
      setIsLoaded(true);
    }
    initSettings();
  }, []);

  const updateSettings = useCallback((newPartial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // 保存失敗の無視
      }
      if (window.electronAPI?.saveSettings) {
        window.electronAPI.saveSettings(updated);
      }
      return updated;
    });
  }, []);

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}

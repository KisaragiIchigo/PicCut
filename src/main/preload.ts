// src/main/preload.ts
import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  AppSettings,
  BatchProcessProgress,
  BoundingBox,
  DetectionColorMode,
  ProcessImageOptions,
  TrimDirection,
} from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  scanDirectory: (dirPath: string) => ipcRenderer.invoke('fs:scanDirectory', dirPath),
  loadImageMetadata: (filePath: string) => ipcRenderer.invoke('image:loadMetadata', filePath),
  detectBounds: (
    filePath: string,
    options: {
      colorMode: DetectionColorMode;
      customColorHex?: string;
      threshold: number;
      direction: TrimDirection;
    }
  ): Promise<BoundingBox> => ipcRenderer.invoke('image:detectBounds', filePath, options),
  processSingleImage: (options: ProcessImageOptions) =>
    ipcRenderer.invoke('image:processSingle', options),
  startBatchProcess: (items: string[], options: ProcessImageOptions) =>
    ipcRenderer.invoke('batch:start', items, options),
  cancelBatchProcess: () => ipcRenderer.invoke('batch:cancel'),
  onBatchProgress: (callback: (progress: BatchProcessProgress) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, value: BatchProcessProgress) =>
      callback(value);
    ipcRenderer.on('batch:progress', subscription);
    return () => {
      ipcRenderer.removeListener('batch:progress', subscription);
    };
  },
  openPathInExplorer: (targetPath: string) => ipcRenderer.invoke('shell:openPath', targetPath),
  showItemInFolder: (itemPath: string) => ipcRenderer.invoke('shell:showItem', itemPath),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', settings),
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
});

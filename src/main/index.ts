// src/main/index.ts
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import { ConfigStore } from './services/configStore';
import {
  computeBatchPlan,
  detectWithCache,
  processSingleImageFile,
  scanDirectoryRecursively,
  BatchProcessor,
  BatchPlanOptions,
} from './services/imageProcessor';
import { ProcessImageOptions } from '../shared/types';


// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.cjs
// │ └─┬ preload
// │   └── preload.cjs
// ├─┬ dist
// │ └── index.html

process.env.DIST = path.join(__dirname, '../../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, '../preload/preload.cjs');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');

const configStore = new ConfigStore();
const batchProcessor = new BatchProcessor();

function createWindow() {
  const saved = configStore.get();

  const options: Electron.BrowserWindowConstructorOptions = {
    title: 'PicCut Ultra',
    icon: path.join(__dirname, '../../piccut.ico'),
    width: saved.winWidth || 1040,
    height: saved.winHeight || 700,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  };

  if (saved.winX >= 0 && saved.winY >= 0) {
    options.x = saved.winX;
    options.y = saved.winY;
  }

  win = new BrowserWindow(options);

  if (saved.isMaximized) {
    win.maximize();
  }

  win.on('resize', () => {
    if (!win || win.isMaximized()) return;
    const [w, h] = win.getSize();
    configStore.save({ winWidth: w, winHeight: h });
  });

  win.on('move', () => {
    if (!win || win.isMaximized()) return;
    const [x, y] = win.getPosition();
    configStore.save({ winX: x, winY: y });
  });

  win.on('maximize', () => {
    configStore.save({ isMaximized: true });
  });

  win.on('unmaximize', () => {
    configStore.save({ isMaximized: false });
  });

  if (url) {
    win.loadURL(url);
  } else {
    win.loadFile(indexHtml);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ===== IPC Handlers =====

ipcMain.on('window:minimize', () => {
  win?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('window:close', () => {
  win?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return win?.isMaximized() ?? false;
});

ipcMain.handle('dialog:selectFiles', async () => {
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    title: 'トリミング対象の画像を選択',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: '画像ファイル',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'avif'],
      },
      { name: 'すべてのファイル', extensions: ['*'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths;
});

ipcMain.handle('dialog:selectDirectory', async () => {
  if (!win) return null;
  const result = await dialog.showOpenDialog(win, {
    title: '画像が含まれるフォルダを選択',
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('fs:scanDirectory', async (_event, dirPath: string) => {
  return scanDirectoryRecursively(dirPath);
});

ipcMain.handle('image:loadMetadata', async (_event, filePath: string) => {
  try {
    const stat = fs.statSync(filePath);
    const meta = await sharp(filePath).metadata();
    // プレビュー用の軽量サムネイルBase64を生成（最大幅800px）
    const thumbBuffer = await sharp(filePath)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .toFormat('webp', { quality: 80 })
      .toBuffer();
    const base64Preview = `data:image/webp;base64,${thumbBuffer.toString('base64')}`;

    return {
      width: meta.width || 0,
      height: meta.height || 0,
      size: stat.size,
      base64Preview,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`画像読み込み失敗: ${msg}`);
  }
});

ipcMain.handle(
  'image:detectBounds',
  async (_event, filePath: string, options) => {
    const detected = await detectWithCache(filePath, options);
    return detected.box;
  }
);

ipcMain.handle(
  'batch:computePlan',
  async (_event, filePaths: string[], options: BatchPlanOptions) => {
    return computeBatchPlan(filePaths, options);
  }
);

ipcMain.handle(
  'image:processSingle',
  async (_event, options: ProcessImageOptions) => {
    return processSingleImageFile(options);
  }
);

ipcMain.handle('batch:start', async (_event, items: string[], options: ProcessImageOptions) => {
  batchProcessor.run(items, options, (progress) => {
    win?.webContents.send('batch:progress', progress);
  });
});

ipcMain.handle('batch:cancel', () => {
  batchProcessor.cancel();
});

ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
  if (fs.existsSync(targetPath)) {
    await shell.openPath(targetPath);
  }
});

ipcMain.handle('shell:showItem', async (_event, itemPath: string) => {
  if (fs.existsSync(itemPath)) {
    shell.showItemInFolder(itemPath);
  }
});

ipcMain.handle('settings:load', () => {
  return configStore.load();
});

ipcMain.handle('settings:save', (_event, newSettings) => {
  configStore.save(newSettings);
});

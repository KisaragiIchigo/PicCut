// src/main/services/configStore.ts
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { AppSettings } from '../../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  colorMode: 'white',
  customColorHex: '#ffffff',
  threshold: 70,
  noiseTolerance: 2,
  direction: 'both',
  unifyBatchSize: true,
  unifyCropPosition: false,
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

export class ConfigStore {
  private configPath: string;
  private currentSettings: AppSettings;

  constructor() {
    const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
    const configDir = path.join(userDataPath, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    this.configPath = path.join(configDir, 'settings.json');
    this.currentSettings = this.load();
  }

  public load(): AppSettings {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // フォールバック時はデフォルト設定を返却
    }
    return { ...DEFAULT_SETTINGS };
  }

  public save(newSettings: Partial<AppSettings>): void {
    try {
      this.currentSettings = { ...this.currentSettings, ...newSettings };
      fs.writeFileSync(this.configPath, JSON.stringify(this.currentSettings, null, 2), 'utf-8');
    } catch {
      // 保存エラー時の抑制
    }
  }

  public get(): AppSettings {
    return this.currentSettings;
  }
}

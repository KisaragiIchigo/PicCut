// src/shared/types.ts
// PicCut Ultra 共通型定義

export type DetectionColorMode = 'white' | 'black' | 'alpha' | 'custom' | 'corner_auto';
export type TrimDirection = 'both' | 'horizontal' | 'vertical' | 'top_only' | 'bottom_only' | 'left_only' | 'right_only';
export type SaveMode = 'remake_folder' | 'overwrite' | 'custom_dir';
export type OutputFormat = 'keep_original' | 'png' | 'webp' | 'jpeg';
export type MarginUnit = 'percent' | 'pixel';
export type MarginBgColorMode = 'transparent' | 'white' | 'black' | 'custom' | 'sampled';

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** 一括処理で全画像に適用する統一プラン */
export interface BatchPlan {
  /** 統一後の出力サイズ（仕上げマージンを足す前） */
  width: number;
  height: number;
  /**
   * 切り出し位置も揃える場合の共通矩形。
   * サイズだけを揃える場合は null で、各画像は個別に検出した位置で切り出す。
   */
  sharedBox: BoundingBox | null;
  /** 解析できた画像の枚数 */
  analyzedCount: number;
}

export interface AppSettings {
  colorMode: DetectionColorMode;
  customColorHex: string;
  threshold: number; // 0 - 255 (許容誤差)
  noiseTolerance: number; // 0 - 10 (%) 帯の中のウォーターマークや圧縮ノイズを無視する割合
  direction: TrimDirection;
  /** 複数枚を一括処理するとき、全画像の出力サイズを揃える */
  unifyBatchSize: boolean;
  /** サイズだけでなく切り出し位置も全画像で揃える（同じレイアウトの連番ページ向け） */
  unifyCropPosition: boolean;
  keepMargin: boolean;
  marginUnit: MarginUnit;
  marginValue: number; // % または px
  marginBgMode: MarginBgColorMode;
  marginCustomColor: string;
  saveMode: SaveMode;
  customOutputDir: string;
  outputFormat: OutputFormat;
  jpegQuality: number; // 1 - 100
  webpQuality: number; // 1 - 100
  addSuffix: boolean;
  suffixString: string;
  // Window state
  winX: number;
  winY: number;
  winWidth: number;
  winHeight: number;
  isMaximized: boolean;
}

export interface ImageItem {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  detectedBox?: BoundingBox;
  previewUrl?: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped';
  errorMessage?: string;
  outputPath?: string;
  outputSize?: number;
}

export interface BatchProcessProgress {
  /** scanning: 統一基準を決めるための全画像プリスキャン中 / processing: 書き出し中 */
  phase: 'scanning' | 'processing';
  currentIndex: number;
  totalCount: number;
  currentFileName: string;
  successCount: number;
  errorCount: number;
  isCompleted: boolean;
  isCancelled: boolean;
  errors: Array<{ filePath: string; error: string }>;
}

export interface ProcessImageOptions {
  filePath: string;
  colorMode: DetectionColorMode;
  customColorHex: string;
  threshold: number;
  noiseTolerance: number;
  direction: TrimDirection;
  unifyBatchSize: boolean;
  unifyCropPosition: boolean;
  keepMargin: boolean;
  marginUnit: MarginUnit;
  marginValue: number;
  marginBgMode: MarginBgColorMode;
  marginCustomColor: string;
  saveMode: SaveMode;
  customOutputDir: string;
  outputFormat: OutputFormat;
  jpegQuality: number;
  webpQuality: number;
  addSuffix: boolean;
  suffixString: string;
}

export interface ElectronAPI {
  selectFiles: () => Promise<string[] | null>;
  selectDirectory: () => Promise<string | null>;
  getPathForFile: (file: File) => string;
  scanDirectory: (dirPath: string) => Promise<string[]>;
  loadImageMetadata: (filePath: string) => Promise<{ width: number; height: number; size: number; base64Preview?: string }>;
  detectBounds: (filePath: string, options: { colorMode: DetectionColorMode; customColorHex?: string; threshold: number; noiseTolerance: number; direction: TrimDirection }) => Promise<BoundingBox>;
  computeBatchPlan: (
    filePaths: string[],
    options: {
      colorMode: DetectionColorMode;
      customColorHex?: string;
      threshold: number;
      noiseTolerance: number;
      direction: TrimDirection;
      unifyCropPosition: boolean;
    }
  ) => Promise<BatchPlan | null>;
  processSingleImage: (options: ProcessImageOptions) => Promise<{ success: boolean; outputPath: string; outputSize: number; error?: string }>;
  startBatchProcess: (items: string[], options: ProcessImageOptions) => Promise<void>;
  cancelBatchProcess: () => Promise<void>;
  onBatchProgress: (callback: (progress: BatchProcessProgress) => void) => () => void;
  openPathInExplorer: (targetPath: string) => Promise<void>;
  showItemInFolder: (itemPath: string) => Promise<void>;
  loadSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  isWindowMaximized: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

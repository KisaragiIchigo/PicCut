// src/renderer/components/ControlPanel.tsx
import React from 'react';
import {
  Sparkles,
  Settings2,
  FolderOpen,
  FileImage,
  Play,
  Layers,
  Palette,
  Maximize,
  Sliders,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  AppSettings,
  TrimDirection,
  SaveMode,
  OutputFormat,
  ImageItem,
} from '../../shared/types';
import { formatBytes } from '../utils/colorUtils';

interface ControlPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
  items: ImageItem[];
  selectedItemIndex: number;
  onSelectItem: (index: number) => void;
  onClearItems: () => void;
  onPickFiles: () => void;
  onPickDirectory: () => void;
  onStartProcessing: () => void;
  isProcessing: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onUpdateSettings,
  items,
  selectedItemIndex,
  onSelectItem,
  onClearItems,
  onPickFiles,
  onPickDirectory,
  onStartProcessing,
  isProcessing,
}) => {
  return (
    <aside className="w-80 h-full flex flex-col bg-[#151923] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shrink-0">
      {/* Panel Header */}
      <div className="h-10 px-4 bg-[#191e2b] border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>インスペクタ設定</span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearItems}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-rose-400 transition-colors"
            title="キューをクリア"
          >
            <Trash2 className="w-3 h-3" />
            <span>クリア</span>
          </button>
        )}
      </div>

      {/* Scrollable Settings Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs select-none">
        {/* 1. 検出カラー */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              検出背景カラー
            </span>
            <span className="text-[10px] text-text-muted font-mono">Tolerance: {settings.threshold}</span>
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onUpdateSettings({ colorMode: 'white' })}
              className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                settings.colorMode === 'white'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-white border border-black/20" />
                <span>白背景</span>
              </div>
              {settings.colorMode === 'white' && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => onUpdateSettings({ colorMode: 'black' })}
              className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                settings.colorMode === 'black'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-black border border-white/20" />
                <span>黒背景</span>
              </div>
              {settings.colorMode === 'black' && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => onUpdateSettings({ colorMode: 'alpha' })}
              className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                settings.colorMode === 'alpha'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%),linear-gradient(-45deg,transparent_75%,#444_75%)] [background-size:4px_4px] border border-white/20" />
                <span>透明 (Alpha)</span>
              </div>
              {settings.colorMode === 'alpha' && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => onUpdateSettings({ colorMode: 'corner_auto' })}
              className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                settings.colorMode === 'corner_auto'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>四隅自動</span>
              </div>
              {settings.colorMode === 'corner_auto' && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
            </button>
          </div>

          {/* しきい値スライダー */}
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>許容しきい値 (厳格 ← → 寛容)</span>
              <span className="font-mono text-amber-400">{settings.threshold}</span>
            </div>
            <input
              type="range"
              min="5"
              max="160"
              value={settings.threshold}
              onChange={(e) => onUpdateSettings({ threshold: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>
        </div>

        {/* 2. トリミング方向 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-secondary flex items-center gap-1.5">
            <Maximize className="w-3.5 h-3.5 text-amber-400" />
            トリミング方向
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'both', label: '両方 (四方)' },
              { id: 'horizontal', label: '左右のみ' },
              { id: 'vertical', label: '上下のみ' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => onUpdateSettings({ direction: d.id as TrimDirection })}
                className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                  settings.direction === d.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                    : 'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.06]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. 余白（マージン）設定 */}
        <div className="space-y-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-text-secondary flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.keepMargin}
                onChange={(e) => onUpdateSettings({ keepMargin: e.target.checked })}
                className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
              />
              <span>余白を残す / 追加</span>
            </label>
            {settings.keepMargin && (
              <span className="text-[10px] font-mono text-amber-400">
                +{settings.marginValue}{settings.marginUnit === 'percent' ? '%' : 'px'}
              </span>
            )}
          </div>

          {settings.keepMargin && (
            <div className="space-y-2 pt-1 border-t border-white/[0.05]">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max={settings.marginUnit === 'percent' ? 50 : 200}
                  value={settings.marginValue}
                  onChange={(e) => onUpdateSettings({ marginValue: Number(e.target.value) })}
                  className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                />
                <div className="flex rounded-md overflow-hidden border border-white/10 shrink-0">
                  <button
                    onClick={() => onUpdateSettings({ marginUnit: 'percent' })}
                    className={`px-2 py-0.5 text-[10px] ${
                      settings.marginUnit === 'percent' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-text-muted'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ marginUnit: 'pixel' })}
                    className={`px-2 py-0.5 text-[10px] ${
                      settings.marginUnit === 'pixel' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-text-muted'
                    }`}
                  >
                    px
                  </button>
                </div>
              </div>

              {/* 余白の背景色 */}
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>余白背景色:</span>
                <select
                  value={settings.marginBgMode}
                  onChange={(e) => onUpdateSettings({ marginBgMode: e.target.value as any })}
                  className="bg-[#10131c] border border-white/10 rounded px-2 py-0.5 text-text-primary text-[11px] focus:outline-none focus:border-amber-500"
                >
                  <option value="transparent">透過 (Transparent)</option>
                  <option value="white">白 (White)</option>
                  <option value="black">黒 (Black)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 4. 保存設定 & 出力フォーマット */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-text-secondary flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-amber-400" />
            保存・出力設定
          </label>

          <div className="space-y-1.5">
            <select
              value={settings.saveMode}
              onChange={(e) => onUpdateSettings({ saveMode: e.target.value as SaveMode })}
              className="w-full bg-[#10131c] border border-white/10 rounded-lg px-2.5 py-1.5 text-text-primary text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="remake_folder">📁 Remake/ フォルダに新規作成 (安全)</option>
              <option value="overwrite">⚠️ 元ファイルに上書き</option>
            </select>

            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={settings.outputFormat}
                onChange={(e) => onUpdateSettings({ outputFormat: e.target.value as OutputFormat })}
                className="bg-[#10131c] border border-white/10 rounded-lg px-2 py-1.5 text-text-primary text-[11px] focus:outline-none focus:border-amber-500"
              >
                <option value="keep_original">形式: 元画像を維持</option>
                <option value="png">形式: PNG (可逆・透過)</option>
                <option value="webp">形式: WebP (軽量)</option>
                <option value="jpeg">形式: JPEG</option>
              </select>

              {/* サフィックス指定 */}
              <label className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[10px] text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.addSuffix}
                  onChange={(e) => onUpdateSettings({ addSuffix: e.target.checked })}
                  className="w-3 h-3 accent-amber-400 rounded"
                />
                <span>末尾に付加</span>
              </label>
            </div>
          </div>
        </div>

        {/* 5. 複数投入時のキュー一覧 */}
        {items.length > 1 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-[11px] text-text-secondary">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                投入リスト ({items.length}件)
              </span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(idx)}
                  className={`w-full px-2 py-1 rounded text-left text-[11px] flex items-center justify-between truncate transition-colors ${
                    selectedItemIndex === idx
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-white/[0.02] text-text-muted hover:text-text-primary hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="truncate">{item.fileName}</span>
                  <span className="font-mono text-[9px] opacity-70 ml-1 shrink-0">
                    {formatBytes(item.fileSize)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 bg-[#181d29] border-t border-white/[0.08] space-y-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onPickFiles}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-text-primary border border-white/10 transition-all text-xs font-medium"
          >
            <FileImage className="w-3.5 h-3.5 text-amber-400" />
            <span>画像選択</span>
          </button>
          <button
            onClick={onPickDirectory}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-text-primary border border-white/10 transition-all text-xs font-medium"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>フォルダ選択</span>
          </button>
        </div>

        {/* 実行ボタン */}
        <button
          onClick={onStartProcessing}
          disabled={items.length === 0 || isProcessing}
          className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg ${
            items.length === 0 || isProcessing
              ? 'bg-white/5 text-text-muted border border-white/5 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 shadow-[0_4px_20px_rgba(245,158,11,0.3)] cursor-pointer active:scale-[0.98]'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>
            {items.length <= 1
              ? 'トリミング実行'
              : `${items.length}件を一括処理開始`}
          </span>
        </button>
      </div>
    </aside>
  );
};

// src/renderer/components/ControlPanel/PanelActions.tsx
import React from 'react';
import { FileImage, FolderOpen, Play } from 'lucide-react';

interface Props {
  itemCount: number;
  isProcessing: boolean;
  onPickFiles: () => void;
  onPickDirectory: () => void;
  onStartProcessing: () => void;
}

export const PanelActions: React.FC<Props> = ({
  itemCount,
  isProcessing,
  onPickFiles,
  onPickDirectory,
  onStartProcessing,
}) => {
  const disabled = itemCount === 0 || isProcessing;

  return (
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

      <button
        onClick={onStartProcessing}
        disabled={disabled}
        className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg ${
          disabled
            ? 'bg-white/5 text-text-muted border border-white/5 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 shadow-[0_4px_20px_rgba(245,158,11,0.3)] cursor-pointer active:scale-[0.98]'
        }`}
      >
        <Play className="w-4 h-4 fill-current" />
        <span>{itemCount <= 1 ? 'トリミング実行' : `${itemCount}件を一括処理開始`}</span>
      </button>
    </div>
  );
};

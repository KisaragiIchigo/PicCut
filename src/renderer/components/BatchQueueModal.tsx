// src/renderer/components/BatchQueueModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  FolderOpen,
  StopCircle,
  Check,
  X,
} from 'lucide-react';
import { BatchProcessProgress } from '../../shared/types';

interface BatchQueueModalProps {
  isOpen: boolean;
  progress: BatchProcessProgress | null;
  onCancel: () => void;
  onClose: () => void;
  onOpenFolder: () => void;
}

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  isOpen,
  progress,
  onCancel,
  onClose,
  onOpenFolder,
}) => {
  if (!isOpen || !progress) return null;

  const percent =
    progress.totalCount > 0
      ? Math.round((progress.currentIndex / progress.totalCount) * 100)
      : 0;

  const isDone = progress.isCompleted || progress.isCancelled;
  // 統一サイズの基準を決めるための事前解析フェーズ
  const isScanning = progress.phase === 'scanning' && !isDone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#161a24] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="h-12 px-5 bg-[#1b202c] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <div
                className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                  isScanning ? 'border-emerald-400' : 'border-amber-400'
                }`}
              />
            )}
            <h3 className="text-xs font-bold text-text-primary">
              {isDone
                ? progress.isCancelled
                  ? '一括処理を中断しました'
                  : '一括トリミング処理が完了しました'
                : isScanning
                  ? '統一サイズの基準を解析中...'
                  : '一括トリミング処理中...'}
            </h3>
          </div>
          {isDone && (
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-secondary">
                {progress.currentIndex} / {progress.totalCount} 枚
              </span>
              <span className={`font-bold ${isScanning ? 'text-emerald-400' : 'text-amber-400'}`}>
                {percent}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10 p-0.5">
              <motion.div
                className={`h-full rounded-full ${
                  isScanning
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Current file name */}
          {!isDone && (
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] truncate text-text-muted">
              <span className="text-text-secondary mr-1">{isScanning ? '解析中:' : '処理中:'}</span>
              <span className="font-mono text-text-primary">{progress.currentFileName || '準備中...'}</span>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <span className="text-[11px] text-emerald-300">成功</span>
              <span className="font-mono font-bold text-emerald-400">{progress.successCount} 件</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
              <span className="text-[11px] text-rose-300">エラー</span>
              <span className="font-mono font-bold text-rose-400">{progress.errorCount} 件</span>
            </div>
          </div>

          {/* Error List if any */}
          {progress.errors.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-rose-400 font-medium">エラー詳細:</span>
              <div className="max-h-24 overflow-y-auto space-y-1 p-2 bg-black/40 rounded-lg border border-rose-500/20 text-[10px] text-rose-300 font-mono">
                {progress.errors.map((e, idx) => (
                  <div key={idx} className="truncate">
                    {e.filePath}: {e.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#1b202d] border-t border-white/[0.08] flex items-center justify-end gap-2 shrink-0">
          {!isDone ? (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-medium transition-all"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>処理を中断</span>
            </button>
          ) : (
            <>
              <button
                onClick={onOpenFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-text-primary border border-white/10 text-xs font-medium transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>保存先フォルダを開く</span>
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>完了</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// src/renderer/components/ReadmeModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, X, Sparkles, CheckCircle2, ShieldCheck, Zap, Scissors } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-[#161a24] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="h-12 px-5 bg-[#1b202c] border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>PicCut Ultra - 使い方 &amp; ガイド</span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-text-secondary leading-relaxed">
          {/* Overview */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-400" />
              ツール概要
            </h4>
            <p>
              画像の不要な余白（白・黒・透明アルファ・自動判定した背景色など）を<strong>自動検出</strong>し、一括で高精度にトリミングするデスクトップツールです。
              ウィンドウの<strong>どこにドラッグ＆ドロップしてもOK</strong>、大量画像でも固まらない完全非同期マルチスレッド処理、<strong>リアルタイムな検出枠プレビュー</strong>を備えています。
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              主な機能と特徴
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  幅広い対応フォーマット
                </span>
                <p className="text-[11px] text-text-muted">
                  PNG / JPG / JPEG / WEBP / BMP / GIF / TIFF / AVIF（透明WebP・PNGのアルファも完全保持）
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  高度な背景検出エンジン
                </span>
                <p className="text-[11px] text-text-muted">
                  白・黒だけでなく、透明度（Alpha）、背景色の自動判定、許容しきい値（Tolerance）、ノイズ許容の調整に対応。ノイズ許容を上げると、余白の帯に入り込んだ透かし文字などを無視して切り抜けます。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  仕上げマージン付与
                </span>
                <p className="text-[11px] text-text-muted">
                  トリミング後に指定比率（%）または固定ピクセル（px）の余白を透過・白・黒キャンバスで付加可能。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  リアルタイム比較プレビュー
                </span>
                <p className="text-[11px] text-text-muted">
                  検出枠オーバーレイ、Before/After スプリット比較、ズーム拡大・縮小に対応。
                </p>
              </div>
            </div>
          </div>

          {/* How to use */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              使い方
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-text-secondary pl-1">
              <li>
                <strong className="text-text-primary">画像を投入</strong>：ウィンドウ内にファイルやフォルダをドラッグ＆ドロップ、または「画像選択」「フォルダ選択」ボタンで追加。
              </li>
              <li>
                <strong className="text-text-primary">パラメータを調整</strong>：右側パネルで検出カラー、トリミング方向、余白%、保存先を選択。
              </li>
              <li>
                <strong className="text-text-primary">プレビュー確認</strong>：中央ビューポートで検出枠（アンバー破線）と削減サイズを確認。
              </li>
              <li>
                <strong className="text-text-primary">処理開始</strong>：「トリミング実行」ボタンをクリック。一括処理時は進捗モーダルが表示され、完了後にワンクリックで保存フォルダを開けます。
              </li>
            </ol>
          </div>

          {/* Safety & License */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-200">安全設計 &amp; 設定の永続化</span>
              <p className="text-[11px] text-amber-300/80">
                デフォルトでは元画像と同じ階層に <code>Remake/</code> フォルダを自動作成して保存するため、元画像が意図せず破損することはありません。設定は自動保存され次回起動時に復元されます。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 px-5 bg-[#1a1f2c] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-text-muted shrink-0">
          <span>PicCut Ultra v1.1.0 ©️ 2025-2026 KisaragiIchigo</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-text-primary font-medium transition-all"
          >
            閉じる
          </button>
        </div>
      </motion.div>
    </div>
  );
};

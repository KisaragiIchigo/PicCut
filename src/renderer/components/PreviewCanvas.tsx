// src/renderer/components/PreviewCanvas.tsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { BoundingBox, ImageItem } from '../../shared/types';
import { formatBytes } from '../utils/colorUtils';

interface PreviewCanvasProps {
  selectedItem: ImageItem | null;
  detectedBox: BoundingBox | null;
  /** サイズ統一で余白が足される場合の、最終的なキャンバス範囲 */
  unifiedBox: BoundingBox | null;
  isLoading: boolean;
  /** 統一が効く場合の最終寸法（仕上げマージンを足す前） */
  outputSize: { width: number; height: number } | null;
  /** 統一の基準を算出中か */
  isPlanning: boolean;
  /** サイズ統一が実際に適用される状態か */
  isUnified: boolean;
  onBoxChange?: (newBox: BoundingBox) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  selectedItem,
  detectedBox,
  unifiedBox,
  isLoading,
  outputSize,
  isPlanning,
  isUnified,
}) => {
  const [zoom, setZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // ズームリセット
  const handleResetZoom = () => setZoom(1);
  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.25, z - 0.25));

  // ホイールズーム
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(3, z + 0.1));
      } else {
        setZoom((z) => Math.max(0.25, z - 0.1));
      }
    }
  };

  // 検出ボックスの比率計算
  const imgWidth = selectedItem?.dimensions?.width || 0;
  const imgHeight = selectedItem?.dimensions?.height || 0;

  // 統一が効く場合は、その画像単体の検出結果ではなく実際に書き出される寸法を見せる
  const boxW = outputSize ? outputSize.width : detectedBox ? detectedBox.width : imgWidth;
  const boxH = outputSize ? outputSize.height : detectedBox ? detectedBox.height : imgHeight;
  const reductionPercent =
    imgWidth && imgHeight && boxW && boxH
      ? Math.max(0, Math.round((1 - (boxW * boxH) / (imgWidth * imgHeight)) * 100))
      : 0;

  if (!selectedItem) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-[#101218] border border-white/[0.07] rounded-xl relative overflow-hidden shadow-inner">
        {/* Soft Ambient glow */}
        <div className="absolute w-96 h-96 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute w-80 h-80 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#161a23] border border-white/[0.09] flex items-center justify-center text-amber-400 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <ImageIcon className="w-8 h-8 opacity-85" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            プレビュー対象がありません
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            画像ファイルまたはフォルダを画面全体にドラッグ＆ドロップするか、右側のボタンから選択してください。
          </p>
          <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-text-secondary">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>白・黒・透明・四隅近似色の余白を自動検出</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="flex-1 h-full flex flex-col bg-[#101218] border border-white/[0.08] rounded-xl overflow-hidden relative shadow-2xl"
    >
      {/* Top Meta Bar */}
      <div className="h-10 px-3.5 bg-[#161a24] border-b border-white/[0.08] flex items-center justify-between text-xs shrink-0 z-20">
        <div className="flex items-center gap-2 truncate">
          <span className="font-medium text-text-primary truncate max-w-[200px]" title={selectedItem.fileName}>
            {selectedItem.fileName}
          </span>
          <span className="text-[11px] text-text-muted font-mono bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            {formatBytes(selectedItem.fileSize)}
          </span>
        </div>

        {/* Dimension & Reduction Stats */}
        <div className="flex items-center gap-2">
          {imgWidth > 0 && imgHeight > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-text-muted">元: {imgWidth}×{imgHeight}</span>
              <span className="text-text-muted">→</span>
              <span className="text-amber-400 font-semibold">後: {boxW}×{boxH}</span>
              {reductionPercent > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 text-[10px]">
                  -{reductionPercent}% 余白削減
                </span>
              )}
              {isPlanning ? (
                <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-text-secondary border border-white/10 text-[10px]">
                  統一サイズを解析中
                </span>
              ) : (
                isUnified && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 text-[10px]">
                    全画像で統一
                  </span>
                )
              )}
            </div>
          )}
        </div>

        {/* Controls: Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/[0.08] rounded transition-colors"
            title="縮小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 text-[11px] font-mono text-text-secondary hover:text-text-primary hover:bg-white/[0.08] rounded transition-colors"
            title="100%にリセット"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/[0.08] rounded transition-colors"
            title="拡大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 bg-[radial-gradient(#202534_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-30"
            >
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[#181c28] border border-amber-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-amber-200 font-medium">境界を解析中...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkerboard Image Container */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Transparent Grid Pattern under image */}
          <div className="relative overflow-hidden rounded shadow-2xl border border-white/10 bg-[linear-gradient(45deg,#1c202d_25%,transparent_25%),linear-gradient(-45deg,#1c202d_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1c202d_75%),linear-gradient(-45deg,transparent_75%,#1c202d_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px]">
            <img
              ref={imgRef}
              src={selectedItem.previewUrl || selectedItem.filePath}
              alt={selectedItem.fileName}
              className="max-h-[60vh] max-w-[50vw] object-contain block pointer-events-none"
            />

            {/* Bounding Box Overlay SVG */}
            {detectedBox && imgWidth > 0 && imgHeight > 0 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${imgWidth} ${imgHeight}`}
                preserveAspectRatio="none"
              >
                {/* Darken Outside Area */}
                <defs>
                  <mask id="cropMask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={detectedBox.left}
                      y={detectedBox.top}
                      width={detectedBox.width}
                      height={detectedBox.height}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0, 0, 0, 0.45)"
                  mask="url(#cropMask)"
                />

                {/* Animated Amber Champagne Bounding Box */}
                <rect
                  x={detectedBox.left}
                  y={detectedBox.top}
                  width={detectedBox.width}
                  height={detectedBox.height}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={Math.max(1.5, Math.round(imgWidth / 400))}
                  strokeDasharray="8 6"
                  className="animate-amber-dash"
                  filter="drop-shadow(0 0 6px rgba(245,158,11,0.6))"
                />

                {/* 統一後のキャンバス範囲。この内側に切り出しが中央配置される */}
                {unifiedBox && (
                  <rect
                    x={unifiedBox.left}
                    y={unifiedBox.top}
                    width={unifiedBox.width}
                    height={unifiedBox.height}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={Math.max(1.5, Math.round(imgWidth / 500))}
                    strokeDasharray="16 12"
                    opacity={0.9}
                    filter="drop-shadow(0 0 5px rgba(16,185,129,0.5))"
                  />
                )}

                {/* Corner Accents */}
                <g stroke="#fbbf24" strokeWidth={Math.max(2.5, Math.round(imgWidth / 300))} fill="none">
                  {/* Top-Left */}
                  <path d={`M ${detectedBox.left} ${detectedBox.top + 12} L ${detectedBox.left} ${detectedBox.top} L ${detectedBox.left + 12} ${detectedBox.top}`} />
                  {/* Top-Right */}
                  <path d={`M ${detectedBox.right - 12} ${detectedBox.top} L ${detectedBox.right} ${detectedBox.top} L ${detectedBox.right} ${detectedBox.top + 12}`} />
                  {/* Bottom-Left */}
                  <path d={`M ${detectedBox.left} ${detectedBox.bottom - 12} L ${detectedBox.left} ${detectedBox.bottom} L ${detectedBox.left + 12} ${detectedBox.bottom}`} />
                  {/* Bottom-Right */}
                  <path d={`M ${detectedBox.right - 12} ${detectedBox.bottom} L ${detectedBox.right} ${detectedBox.bottom} L ${detectedBox.right} ${detectedBox.bottom - 12}`} />
                </g>
              </svg>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

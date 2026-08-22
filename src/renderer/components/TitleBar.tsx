// src/renderer/components/TitleBar.tsx
import React, { useState, useEffect } from 'react';
import { Minus, Square, X, BookOpen, Scissors } from 'lucide-react';

interface TitleBarProps {
  onOpenReadme: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenReadme }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    async function checkMax() {
      if (window.electronAPI?.isWindowMaximized) {
        const max = await window.electronAPI.isWindowMaximized();
        setIsMaximized(max);
      }
    }
    checkMax();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  return (
    <header
      className="h-10 flex items-center justify-between px-3.5 bg-[#141720] border-b border-white/[0.08] select-none z-40 shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: Brand & Readme */}
      <div className="flex items-center gap-3 no-drag" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wide">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-semibold">
            PicCut <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 ml-1 border border-amber-500/30">Ultra</span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <button
          onClick={onOpenReadme}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-secondary hover:text-amber-300 hover:bg-white/[0.06] rounded-md transition-all border border-transparent hover:border-white/10"
          title="使い方とガイド（README）"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>README</span>
        </button>
      </div>

      {/* Center: Title / Drag Area */}
      <div className="text-xs text-text-muted font-mono tracking-wider opacity-60">
        一括余白トリミング &amp; マージン最適化スタジオ
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1 no-drag" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/[0.08] rounded transition-colors"
          title="最小化"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/[0.08] rounded transition-colors"
          title={isMaximized ? "元に戻す" : "最大化"}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-white hover:bg-rose-600/90 rounded transition-colors"
          title="閉じる"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

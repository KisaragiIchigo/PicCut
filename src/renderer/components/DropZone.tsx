// src/renderer/components/DropZone.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud } from 'lucide-react';

interface DropZoneProps {
  onFilesDropped: (filePaths: string[]) => void;
  children: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped, children }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter = 0;

      if (!e.dataTransfer) return;

      const droppedPaths: string[] = [];
      const files = Array.from(e.dataTransfer.files);

      for (const file of files) {
        const p = window.electronAPI?.getPathForFile(file);
        if (p) {
          droppedPaths.push(p);
        }
      }

      if (droppedPaths.length > 0) {
        onFilesDropped(droppedPaths);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesDropped]);

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden">
      {children}

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[#0f1118]/95 backdrop-blur-sm border-2 border-dashed border-amber-400/80 rounded-2xl m-2 flex flex-col items-center justify-center z-50 pointer-events-none shadow-[0_0_40px_rgba(245,158,11,0.25)]"
          >
            <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4 shadow-[0_4px_20px_rgba(245,158,11,0.3)] animate-bounce">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1 tracking-wide">
              ここに画像またはフォルダをドロップ
            </h2>
            <p className="text-xs text-amber-300/80 font-mono">
              複数ファイル / フォルダ一括投入対応
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

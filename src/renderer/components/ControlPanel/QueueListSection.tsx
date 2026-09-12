// src/renderer/components/ControlPanel/QueueListSection.tsx
import React from 'react';
import { Layers } from 'lucide-react';
import { ImageItem } from '../../../shared/types';
import { formatBytes } from '../../utils/colorUtils';

interface Props {
  items: ImageItem[];
  selectedItemIndex: number;
  onSelectItem: (index: number) => void;
}

export const QueueListSection: React.FC<Props> = ({ items, selectedItemIndex, onSelectItem }) => (
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
);

// src/renderer/components/ControlPanel/index.tsx
import React from 'react';
import { Sliders, Trash2 } from 'lucide-react';
import { AppSettings, BatchPlan, BatchPlanGroup, ImageItem } from '../../../shared/types';
import { DetectionColorSection } from './DetectionColorSection';
import { MarginSection } from './MarginSection';
import { OutputSection } from './OutputSection';
import { PanelActions } from './PanelActions';
import { QueueListSection } from './QueueListSection';
import { TrimDirectionSection } from './TrimDirectionSection';
import { UnifySizeSection } from './UnifySizeSection';

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
  batchPlan: BatchPlan | null;
  activeGroup: BatchPlanGroup | null;
  isPlanning: boolean;
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
  batchPlan,
  activeGroup,
  isPlanning,
}) => (
  <aside className="w-80 h-full flex flex-col bg-[#151923] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shrink-0">
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

    <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs select-none">
      <DetectionColorSection settings={settings} onUpdateSettings={onUpdateSettings} />
      <TrimDirectionSection settings={settings} onUpdateSettings={onUpdateSettings} />
      <UnifySizeSection
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        itemCount={items.length}
        batchPlan={batchPlan}
        activeGroup={activeGroup}
        isPlanning={isPlanning}
      />
      <MarginSection settings={settings} onUpdateSettings={onUpdateSettings} />
      <OutputSection settings={settings} onUpdateSettings={onUpdateSettings} />
      {items.length > 1 && (
        <QueueListSection
          items={items}
          selectedItemIndex={selectedItemIndex}
          onSelectItem={onSelectItem}
        />
      )}
    </div>

    <PanelActions
      itemCount={items.length}
      isProcessing={isProcessing}
      onPickFiles={onPickFiles}
      onPickDirectory={onPickDirectory}
      onStartProcessing={onStartProcessing}
    />
  </aside>
);

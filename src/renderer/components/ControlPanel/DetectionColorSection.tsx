// src/renderer/components/ControlPanel/DetectionColorSection.tsx
import React from 'react';
import { CheckCircle2, Palette, Sparkles } from 'lucide-react';
import { AppSettings, DetectionColorMode } from '../../../shared/types';
import { choiceButtonClass, sliderClass } from './controlStyles';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
}

const COLOR_MODES: Array<{ id: DetectionColorMode; label: string; swatch: React.ReactNode }> = [
  {
    id: 'white',
    label: '白背景',
    swatch: <span className="w-3 h-3 rounded-full bg-white border border-black/20" />,
  },
  {
    id: 'black',
    label: '黒背景',
    swatch: <span className="w-3 h-3 rounded-full bg-black border border-white/20" />,
  },
  {
    id: 'alpha',
    label: '透明 (Alpha)',
    swatch: (
      <span className="w-3 h-3 rounded-full bg-[linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%),linear-gradient(-45deg,transparent_75%,#444_75%)] [background-size:4px_4px] border border-white/20" />
    ),
  },
  {
    id: 'corner_auto',
    label: '背景自動',
    swatch: <Sparkles className="w-3 h-3 text-emerald-400" />,
  },
];

export const DetectionColorSection: React.FC<Props> = ({ settings, onUpdateSettings }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-medium text-text-secondary flex items-center justify-between">
      <span className="flex items-center gap-1.5">
        <Palette className="w-3.5 h-3.5 text-amber-400" />
        検出背景カラー
      </span>
      <span className="text-[10px] text-text-muted font-mono">Tolerance: {settings.threshold}</span>
    </label>

    <div className="grid grid-cols-2 gap-1.5">
      {COLOR_MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onUpdateSettings({ colorMode: mode.id })}
          className={choiceButtonClass(settings.colorMode === mode.id)}
        >
          <div className="flex items-center gap-1.5">
            {mode.swatch}
            <span>{mode.label}</span>
          </div>
          {settings.colorMode === mode.id && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
        </button>
      ))}
    </div>

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
        className={sliderClass}
      />
    </div>

    <div className="pt-1 space-y-1">
      <div className="flex items-center justify-between text-[10px] text-text-muted">
        <span>ノイズ許容 (帯の中の透かし文字を無視)</span>
        <span className="font-mono text-amber-400">{settings.noiseTolerance}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={settings.noiseTolerance}
        onChange={(e) => onUpdateSettings({ noiseTolerance: Number(e.target.value) })}
        className={sliderClass}
      />
    </div>
  </div>
);

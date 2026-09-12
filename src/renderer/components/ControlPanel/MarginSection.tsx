// src/renderer/components/ControlPanel/MarginSection.tsx
import React from 'react';
import { AppSettings, MarginBgColorMode } from '../../../shared/types';
import { sectionCardClass, sliderClass } from './controlStyles';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
}

export const MarginSection: React.FC<Props> = ({ settings, onUpdateSettings }) => (
  <div className={sectionCardClass}>
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
          +{settings.marginValue}
          {settings.marginUnit === 'percent' ? '%' : 'px'}
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
            className={`flex-1 ${sliderClass}`}
          />
          <div className="flex rounded-md overflow-hidden border border-white/10 shrink-0">
            <button
              onClick={() => onUpdateSettings({ marginUnit: 'percent' })}
              className={`px-2 py-0.5 text-[10px] ${
                settings.marginUnit === 'percent'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-text-muted'
              }`}
            >
              %
            </button>
            <button
              onClick={() => onUpdateSettings({ marginUnit: 'pixel' })}
              className={`px-2 py-0.5 text-[10px] ${
                settings.marginUnit === 'pixel'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-text-muted'
              }`}
            >
              px
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>余白背景色:</span>
          <select
            value={settings.marginBgMode}
            onChange={(e) =>
              onUpdateSettings({ marginBgMode: e.target.value as MarginBgColorMode })
            }
            className="bg-[#10131c] border border-white/10 rounded px-2 py-0.5 text-text-primary text-[11px] focus:outline-none focus:border-amber-500"
          >
            <option value="transparent">透過 (Transparent)</option>
            <option value="white">白 (White)</option>
            <option value="black">黒 (Black)</option>
            <option value="sampled">検出した背景色に合わせる</option>
          </select>
        </div>
      </div>
    )}
  </div>
);

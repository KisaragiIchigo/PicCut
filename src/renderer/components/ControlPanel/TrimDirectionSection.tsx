// src/renderer/components/ControlPanel/TrimDirectionSection.tsx
import React from 'react';
import { Maximize } from 'lucide-react';
import { AppSettings, TrimDirection } from '../../../shared/types';
import { sectionLabelClass, toggleButtonClass } from './controlStyles';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
}

const BOTH_SIDES: Array<{ id: TrimDirection; label: string }> = [
  { id: 'both', label: '両方 (四方)' },
  { id: 'horizontal', label: '左右のみ' },
  { id: 'vertical', label: '上下のみ' },
];

const SINGLE_SIDE: Array<{ id: TrimDirection; label: string }> = [
  { id: 'left_only', label: '左だけ' },
  { id: 'right_only', label: '右だけ' },
  { id: 'top_only', label: '上だけ' },
  { id: 'bottom_only', label: '下だけ' },
];

export const TrimDirectionSection: React.FC<Props> = ({ settings, onUpdateSettings }) => (
  <div className="space-y-1.5">
    <label className={sectionLabelClass}>
      <Maximize className="w-3.5 h-3.5 text-amber-400" />
      トリミング方向
    </label>

    <div className="grid grid-cols-3 gap-1.5">
      {BOTH_SIDES.map((d) => (
        <button
          key={d.id}
          onClick={() => onUpdateSettings({ direction: d.id })}
          className={toggleButtonClass(settings.direction === d.id)}
        >
          {d.label}
        </button>
      ))}
    </div>

    <div className="pt-1 space-y-1">
      <span className="text-[11px] text-text-secondary">片側だけを切り落とす</span>
      <div className="grid grid-cols-4 gap-1.5">
        {SINGLE_SIDE.map((d) => (
          <button
            key={d.id}
            onClick={() => onUpdateSettings({ direction: d.id })}
            className={toggleButtonClass(settings.direction === d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>

    <p className="text-xs text-text-secondary leading-relaxed pt-0.5">
      左右どちらに余白があるかが画像ごとに違う場合は、「両方」または「左右のみ」を選んでください。
      各画像で余白のある側だけが自動的に削られます。
    </p>
  </div>
);

// src/renderer/components/ControlPanel/UnifySizeSection.tsx
import React from 'react';
import { Frame } from 'lucide-react';
import { AppSettings, BatchPlan } from '../../../shared/types';
import { helpTextClass, sectionCardClass } from './controlStyles';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
  itemCount: number;
  batchPlan: BatchPlan | null;
  isPlanning: boolean;
}

export const UnifySizeSection: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  itemCount,
  batchPlan,
  isPlanning,
}) => (
  <div className={sectionCardClass}>
    <label className="flex items-center justify-between cursor-pointer">
      <span className="flex items-center gap-2 text-[11px] font-medium text-text-secondary">
        <input
          type="checkbox"
          checked={settings.unifyBatchSize}
          onChange={(e) => onUpdateSettings({ unifyBatchSize: e.target.checked })}
          className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
        />
        <Frame className="w-3.5 h-3.5 text-emerald-400" />
        <span>一括サイズ統一</span>
      </span>
    </label>

    <p className={helpTextClass}>
      複数枚をまとめて処理するとき、すべての画像を同じ出力サイズに揃えます。
      余白のある側が画像ごとに異なっていても、それぞれの余白を正しく削ったうえでサイズだけを合わせます。
    </p>

    {settings.unifyBatchSize && (
      <>
        <div className="pt-1 border-t border-white/[0.05] space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] font-medium text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={settings.unifyCropPosition}
              onChange={(e) => onUpdateSettings({ unifyCropPosition: e.target.checked })}
              className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
            />
            <span>切り出し位置も揃える</span>
          </label>
          <p className={helpTextClass}>
            全画像をまったく同じ座標で切り抜きます。同じ判型のページが並ぶ場合に、めくったときの位置ずれを防げます。
            余白の位置が画像ごとに違う場合は、外側に合わせるため余白が残ります。
          </p>
        </div>

        <div className="pt-1 border-t border-white/[0.05] text-[11px] font-mono">
          {itemCount <= 1 ? (
            <span className="text-text-muted">2枚以上の投入で有効になります</span>
          ) : isPlanning ? (
            <span className="text-emerald-400">統一サイズを解析中...</span>
          ) : batchPlan ? (
            <span className="text-emerald-400">
              {batchPlan.analyzedCount}件 → {batchPlan.width}×{batchPlan.height} に統一
            </span>
          ) : (
            <span className="text-text-muted">解析待ち</span>
          )}
        </div>
      </>
    )}
  </div>
);

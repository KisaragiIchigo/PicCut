// src/renderer/components/ControlPanel/UnifySizeSection.tsx
import React from 'react';
import { Frame } from 'lucide-react';
import { AppSettings, BatchPlan, BatchPlanGroup } from '../../../shared/types';
import { helpTextClass, sectionCardClass } from './controlStyles';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
  itemCount: number;
  batchPlan: BatchPlan | null;
  /** 選択中の画像に適用されるグループ */
  activeGroup: BatchPlanGroup | null;
  isPlanning: boolean;
}

export const UnifySizeSection: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  itemCount,
  batchPlan,
  activeGroup,
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
      複数枚をまとめて処理するとき、出力サイズを揃えます。
      余白のある側が画像ごとに異なっていても、それぞれの余白を正しく削ったうえでサイズだけを合わせます。
      揃える相手は<strong className="text-text-primary">元の寸法が同じ画像どうし</strong>に限られるため、
      表紙と本文のように判型の違うものが混ざっていても、互いのサイズに引きずられることはありません。
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

        <div className="pt-1 border-t border-white/[0.05] text-[11px] font-mono space-y-0.5">
          {itemCount <= 1 ? (
            <span className="text-text-muted">2枚以上の投入で有効になります</span>
          ) : isPlanning ? (
            <span className="text-emerald-400">統一サイズを解析中...</span>
          ) : batchPlan ? (
            <>
              <div className="text-emerald-400">
                {activeGroup
                  ? `この画像: ${activeGroup.memberCount}件を ${activeGroup.width}×${activeGroup.height} に統一`
                  : `${batchPlan.analyzedCount}件を解析済み`}
              </div>
              {batchPlan.groups.length > 1 && (
                <div className="text-text-muted">
                  元の寸法が {batchPlan.groups.length} 種類あるため、判型ごとに分けて揃えます
                </div>
              )}
            </>
          ) : (
            <span className="text-text-muted">解析待ち</span>
          )}
        </div>
      </>
    )}
  </div>
);

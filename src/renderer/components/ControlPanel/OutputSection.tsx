// src/renderer/components/ControlPanel/OutputSection.tsx
import React from 'react';
import { Settings2 } from 'lucide-react';
import { AppSettings, OutputFormat, SaveMode } from '../../../shared/types';
import { sectionLabelClass, selectClass } from './controlStyles';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newPartial: Partial<AppSettings>) => void;
}

export const OutputSection: React.FC<Props> = ({ settings, onUpdateSettings }) => (
  <div className="space-y-2">
    <label className={sectionLabelClass}>
      <Settings2 className="w-3.5 h-3.5 text-amber-400" />
      保存・出力設定
    </label>

    <div className="space-y-1.5">
      <select
        value={settings.saveMode}
        onChange={(e) => onUpdateSettings({ saveMode: e.target.value as SaveMode })}
        className="w-full bg-[#10131c] border border-white/10 rounded-lg px-2.5 py-1.5 text-text-primary text-xs focus:outline-none focus:border-amber-500"
      >
        <option value="remake_folder">📁 Remake/ フォルダに新規作成 (安全)</option>
        <option value="overwrite">⚠️ 元ファイルに上書き</option>
      </select>

      <div className="grid grid-cols-2 gap-1.5">
        <select
          value={settings.outputFormat}
          onChange={(e) => onUpdateSettings({ outputFormat: e.target.value as OutputFormat })}
          className={selectClass}
        >
          <option value="keep_original">形式: 元画像を維持</option>
          <option value="png">形式: PNG (可逆・透過)</option>
          <option value="webp">形式: WebP (軽量)</option>
          <option value="jpeg">形式: JPEG</option>
        </select>

        <label className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-[10px] text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={settings.addSuffix}
            onChange={(e) => onUpdateSettings({ addSuffix: e.target.checked })}
            className="w-3 h-3 accent-amber-400 rounded"
          />
          <span>末尾に付加</span>
        </label>
      </div>
    </div>
  </div>
);

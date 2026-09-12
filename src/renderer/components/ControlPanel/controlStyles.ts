// src/renderer/components/ControlPanel/controlStyles.ts
// インスペクタ内で繰り返し使う見た目の定義。色や質感は project_style.json に従う。

export const sectionLabelClass =
  'text-[11px] font-medium text-text-secondary flex items-center gap-1.5';

export const sectionCardClass =
  'space-y-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]';

export const helpTextClass = 'text-xs text-text-secondary leading-relaxed';

export const selectClass =
  'bg-[#10131c] border border-white/10 rounded-lg px-2 py-1.5 text-text-primary text-[11px] focus:outline-none focus:border-amber-500';

export const sliderClass = 'w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg';

const activeToneClass = 'bg-amber-500/15 border-amber-500/50 text-amber-200';
const idleToneClass =
  'bg-white/[0.03] border-white/[0.08] text-text-secondary hover:bg-white/[0.06]';

/** 選択肢ボタン（左にラベル、右に選択マーク） */
export const choiceButtonClass = (active: boolean): string =>
  `px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
    active ? activeToneClass : idleToneClass
  }`;

/** 方向ボタンなどの、中央揃えの小さな切り替えボタン */
export const toggleButtonClass = (active: boolean): string =>
  `py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
    active ? activeToneClass : idleToneClass
  }`;

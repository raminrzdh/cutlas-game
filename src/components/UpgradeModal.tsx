import React from 'react';
import { Upgrade, VisualTheme } from '../types/game';

interface UpgradeModalProps {
  options: Upgrade[];
  theme: VisualTheme;
  wave: number;
  onSelect: (upgrade: Upgrade) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  options,
  theme,
  wave,
  onSelect,
}) => {
  const isDark = theme === 'midnight';
  const textColor = isDark ? 'text-slate-100' : 'text-stone-900';
  const subtleColor = isDark ? 'text-slate-400' : 'text-stone-600';
  const borderCol = isDark ? 'border-slate-700' : 'border-stone-800';
  const bgCard = isDark ? 'bg-slate-900/95' : 'bg-[#fcfaf5]';

  const renderIcon = (type: string) => {
    switch (type) {
      case 'horse':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <ellipse cx="24" cy="28" rx="14" ry="7" />
            <line x1="32" y1="26" x2="38" y2="12" />
            <ellipse cx="40" cy="10" rx="5" ry="3" />
            <line x1="33" y1="21" x2="30" y2="19" />
            <line x1="35" y1="16" x2="32" y2="14" />
            <polyline points="28,34 32,44" />
            <polyline points="18,34 14,44" />
            <line x1="10" y1="28" x2="4" y2="30" />
          </svg>
        );
      case 'dual_sword':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 38L38 10" />
            <path d="M38 10C42 12 40 18 36 20L18 38" />
            <line x1="14" y1="34" x2="8" y2="40" />
            <path d="M38 38L10 10" />
            <line x1="34" y1="34" x2="40" y2="40" />
          </svg>
        );
      case 'razor_wave':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#dc2626" strokeWidth="2.8" strokeLinecap="round">
            <path d="M12 36 A 22 22 0 0 1 36 12" />
            <path d="M18 42 A 26 26 0 0 1 42 18" strokeDasharray="3 3" />
          </svg>
        );
      case 'revolver':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="10" y="20" width="22" height="8" rx="1" />
            <line x1="32" y1="22" x2="42" y2="22" />
            <line x1="18" y1="28" x2="14" y2="40" />
            <line x1="14" y1="40" x2="22" y2="40" />
            <line x1="22" y1="20" x2="22" y2="28" />
          </svg>
        );
      case 'armor':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M24 6L10 12V24C10 34 24 42 24 42C24 42 38 34 38 24V12L24 6Z" />
            <line x1="24" y1="6" x2="24" y2="42" />
          </svg>
        );
      case 'dynamite':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
            <rect x="16" y="14" width="16" height="24" rx="2" />
            <line x1="24" y1="14" x2="24" y2="6" stroke="#d97706" />
            <circle cx="24" cy="5" r="2" stroke="#d97706" />
          </svg>
        );
      case 'spurs':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="28" cy="24" r="8" />
            <line x1="28" y1="12" x2="28" y2="36" />
            <line x1="16" y1="24" x2="40" y2="24" />
            <path d="M10 24L20 24" />
          </svg>
        );
      case 'magnet':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M14 12V24C14 29.5 18.5 34 24 34C29.5 34 34 29.5 34 24V12" />
            <line x1="10" y1="12" x2="18" y2="12" />
            <line x1="30" y1="12" x2="38" y2="12" />
          </svg>
        );
      case 'dog':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <ellipse cx="22" cy="26" rx="12" ry="7" fill="#ffffff" />
            <ellipse cx="33" cy="20" rx="6" ry="5" fill="#ffffff" />
            <circle cx="38" cy="20" r="1.5" fill="currentColor" />
            <line x1="31" y1="16" x2="27" y2="21" />
            <line x1="28" y1="23" x2="28" y2="29" stroke="#dc2626" strokeWidth="3" />
            <line x1="10" y1="25" x2="4" y2="17" />
            <line x1="29" y1="33" x2="31" y2="42" />
            <line x1="24" y1="33" x2="22" y2="42" />
            <line x1="17" y1="33" x2="16" y2="42" />
            <line x1="12" y1="33" x2="10" y2="42" />
          </svg>
        );
      case 'heart':
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
            <path d="M24 14 C20 6 10 10 12 22 C14 30 24 38 24 38 C24 38 34 30 36 22 C38 10 28 6 24 14 Z" />
          </svg>
        );
      default:
        return (
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
            <polygon points="24,6 29,18 42,19 32,28 35,41 24,34 13,41 16,28 6,19 19,18" />
          </svg>
        );
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-30 font-mono select-none">
      <div className={`w-full max-w-4xl p-6 md:p-8 rounded-lg border-2 ${borderCol} ${bgCard} shadow-2xl flex flex-col gap-6`}>
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
            <span>FRONTIER SALOON</span>
            <span>·</span>
            <span>WAVE {wave} SURVIVED</span>
          </div>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${textColor}`}>
            CHOOSE YOUR UPGRADE
          </h2>
          <p className={`text-xs md:text-sm mt-1 ${subtleColor}`}>
            Reinforce your stick gunslinger before the next posse rolls in.
          </p>
        </div>

        {/* 3 Upgrades Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((upgrade, idx) => (
            <button
              key={upgrade.id}
              onClick={() => onSelect(upgrade)}
              className={`p-5 rounded border-2 ${borderCol} ${bgCard} hover:border-red-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between items-start text-left group shadow-sm cursor-pointer`}
            >
              <div className="w-full flex items-start justify-between mb-4">
                <div className={`${textColor} group-hover:text-red-600 transition-colors`}>
                  {renderIcon(upgrade.iconType)}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className={`px-2 py-0.5 rounded border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-300 bg-stone-100'} uppercase`}>
                    {upgrade.category}
                  </span>
                  <span className="text-red-600 font-bold">
                    {upgrade.level > 0 ? `LV ${upgrade.level + 1}` : 'NEW'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className={`text-base font-bold ${textColor} group-hover:text-red-600 transition-colors mb-1`}>
                  {upgrade.name}
                </h3>
                <p className={`text-xs leading-relaxed ${subtleColor}`}>
                  {upgrade.description}
                </p>
              </div>

              <div className="w-full pt-3 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-red-600">
                <span>SELECT [{idx + 1}]</span>
                <span className="text-sm font-black">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

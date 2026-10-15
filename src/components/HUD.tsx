import React from 'react';
import { Player, GameStats, VisualTheme } from '../types/game';
import { Volume2, VolumeX, Music, Pause, Play, Sparkles } from 'lucide-react';
import { sound } from '../audio/synthEngine';

interface HUDProps {
  player: Player;
  stats: GameStats;
  theme: VisualTheme;
  isPaused: boolean;
  isMuted: boolean;
  isMusicActive: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onToggleTheme: () => void;
  onMountToggle: () => void;
  onWeaponSwitch: (w: 'cutlas' | 'revolver') => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  stats,
  theme,
  isPaused,
  isMuted,
  isMusicActive,
  onTogglePause,
  onToggleMute,
  onToggleMusic,
  onToggleTheme,
  onMountToggle,
  onWeaponSwitch,
}) => {
  const isDark = theme === 'midnight';
  const textColor = isDark ? 'text-slate-100' : 'text-stone-900';
  const subtleColor = isDark ? 'text-slate-400' : 'text-stone-600';
  const borderCol = isDark ? 'border-slate-700' : 'border-stone-800';
  const bgPanel = isDark ? 'bg-slate-900/80' : 'bg-[#f7f4ed]/90';

  // Render Hearts as minimalist line hearts
  const hearts = [];
  for (let i = 0; i < player.maxHp; i++) {
    const filled = i < player.hp;
    hearts.push(
      <svg
        key={i}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={filled ? '#dc2626' : (isDark ? '#475569' : '#a8a29e')}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 font-mono z-10">
      {/* Top Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left Status: Health & Bounty */}
        <div className={`pointer-events-auto flex flex-col gap-2 p-3 rounded border-2 ${borderCol} ${bgPanel} shadow-sm backdrop-blur-[2px]`}>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs uppercase tracking-wider font-bold mr-1 ${subtleColor}`}>HP</span>
            <div className="flex items-center gap-1">{hearts}</div>
          </div>

          <div className="flex items-center gap-4 text-sm font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">$</span>
              <span className={`${textColor} tabular-nums text-base`}>{stats.bounty}</span>
              <span className={`text-[11px] ${subtleColor}`}>BOUNTY</span>
            </div>

            <div className={`h-3.5 w-px ${isDark ? 'bg-slate-700' : 'bg-stone-300'}`} />

            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] ${subtleColor}`}>WAVE</span>
              <span className="text-red-600 text-base tabular-nums font-black">{stats.wave}</span>
            </div>

            <div className={`h-3.5 w-px ${isDark ? 'bg-slate-700' : 'bg-stone-300'}`} />

            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] ${subtleColor}`}>SCORE</span>
              <span className={`${textColor} tabular-nums`}>{stats.score}</span>
            </div>
          </div>
        </div>

        {/* Right Status: Controls, Audio & Theme */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Theme switcher */}
          <button
            onClick={onToggleTheme}
            title="Switch Theme (Ink / Midnight / Sepia)"
            className={`p-2.5 rounded border-2 ${borderCol} ${bgPanel} ${textColor} hover:border-red-600 transition-colors flex items-center gap-1 text-xs font-bold`}
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline uppercase text-[10px] tracking-wider">{theme}</span>
          </button>

          {/* Synth Music Toggle */}
          <button
            onClick={onToggleMusic}
            title={isMusicActive ? 'Mute Spaghetti Synth Music' : 'Play Spaghetti Synth Music'}
            className={`p-2.5 rounded border-2 ${borderCol} ${bgPanel} ${textColor} hover:border-red-600 transition-colors flex items-center gap-1`}
          >
            <Music size={16} className={isMusicActive ? 'text-red-600 animate-pulse' : 'opacity-40'} />
          </button>

          {/* Master Sound Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className={`p-2.5 rounded border-2 ${borderCol} ${bgPanel} ${textColor} hover:border-red-600 transition-colors`}
          >
            {isMuted ? <VolumeX size={16} className="text-red-600" /> : <Volume2 size={16} />}
          </button>

          {/* Pause */}
          <button
            onClick={onTogglePause}
            title="Pause Game (Esc / P)"
            className={`p-2.5 rounded border-2 ${borderCol} ${bgPanel} ${textColor} hover:border-red-600 transition-colors`}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      </div>

      {/* Bottom Center / Right Weapon & Mount Tray */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* Controls Quick Reference hint */}
        <div className={`hidden md:flex items-center gap-3 text-xs p-2.5 rounded border-2 ${borderCol} ${bgPanel} ${subtleColor}`}>
          <span><kbd className="px-1.5 py-0.5 border border-stone-400 rounded text-[11px] font-bold">WASD</kbd> Move</span>
          <span>·</span>
          <span><kbd className="px-1.5 py-0.5 border border-stone-400 rounded text-[11px] font-bold">L-Click</kbd> Slash/Fire</span>
          <span>·</span>
          <span><kbd className="px-1.5 py-0.5 border border-stone-400 rounded text-[11px] font-bold">R-Click</kbd> Dash</span>
          {player.horseUnlocked && (
            <>
              <span>·</span>
              <span><kbd className="px-1.5 py-0.5 border border-stone-400 rounded text-[11px] font-bold">E</kbd> Mount Horse</span>
            </>
          )}
          {player.dynamiteUnlocked && (
            <>
              <span>·</span>
              <span><kbd className="px-1.5 py-0.5 border border-stone-400 rounded text-[11px] font-bold">Q</kbd> Dynamite</span>
            </>
          )}
        </div>

        {/* Weapons & Horse Mount Selector */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Horse Mount Toggle button */}
          {player.horseUnlocked && (
            <button
              onClick={onMountToggle}
              className={`p-2.5 px-3 rounded border-2 ${borderCol} ${bgPanel} flex items-center gap-2 font-bold text-xs transition-colors ${
                player.isMounted ? 'border-red-600 text-red-600' : textColor
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="16" cy="6" r="3" />
                <path d="M4 18v-4l6-6h6l4 8" />
                <path d="M8 18v3" />
                <path d="M16 18v3" />
              </svg>
              <span>{player.isMounted ? 'MOUNTED [E]' : 'HORSE [E]'}</span>
            </button>
          )}

          {/* Cutlas slot */}
          <button
            onClick={() => onWeaponSwitch('cutlas')}
            className={`p-2.5 px-3 rounded border-2 flex items-center gap-2 font-bold text-xs transition-all ${bgPanel} ${
              player.weapon !== 'revolver' ? 'border-red-600 text-red-600 shadow-sm' : `${borderCol} ${textColor}`
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 20L18 6" />
              <path d="M18 6c2-1 4 0 4 2s-1 3-3 4L8 20" />
              <path d="M7 17l-3 3" />
              <path d="M5 15l4 4" />
            </svg>
            <span>CUTLAS [1]</span>
          </button>

          {/* Revolver slot */}
          <button
            onClick={() => onWeaponSwitch('revolver')}
            className={`p-2.5 px-3 rounded border-2 flex items-center gap-2 font-bold text-xs transition-all ${bgPanel} ${
              player.weapon === 'revolver' ? 'border-red-600 text-red-600 shadow-sm' : `${borderCol} ${textColor}`
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 11h11v4H3z" />
              <path d="M14 9h7v3h-7z" />
              <path d="M6 15v5l3 2v-7" />
            </svg>
            <div className="flex items-center gap-1">
              <span>GUN [2]</span>
              <span className="text-[11px] opacity-75 font-mono">({player.gunAmmo}/{player.maxGunAmmo})</span>
            </div>
          </button>

          {/* Dash readiness indicator */}
          <div className={`p-2.5 rounded border-2 ${borderCol} ${bgPanel} flex items-center gap-1.5 text-xs font-bold ${textColor}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${player.dashTimer <= 0 ? 'bg-red-600 animate-pulse' : 'bg-stone-400'}`} />
            <span>DASH</span>
          </div>
        </div>
      </div>
    </div>
  );
};

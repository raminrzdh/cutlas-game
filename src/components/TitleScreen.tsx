import React, { useEffect } from 'react';
import { VisualTheme } from '../types/game';
import { Volume2, VolumeX, Music, Play, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  theme: VisualTheme;
  highScore: number;
  isMuted: boolean;
  isMusicActive: boolean;
  onStart: () => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  theme,
  highScore,
  isMuted,
  isMusicActive,
  onStart,
  onToggleTheme,
  onToggleMute,
  onToggleMusic,
}) => {
  const isDark = theme === 'midnight';
  const textColor = isDark ? 'text-slate-100' : 'text-stone-900';
  const borderCol = isDark ? 'border-slate-700' : 'border-stone-900';
  const subtleColor = isDark ? 'text-slate-400' : 'text-stone-600';
  const accentRed = isDark ? 'text-rose-500' : 'text-red-600';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-6 md:p-10 z-20 pointer-events-auto font-mono select-none">
      {/* Top Bar / Theme and Audio */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs uppercase tracking-widest font-bold ${subtleColor}`}>
            SKETCHBOOK EDITION v1.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={`p-2.5 rounded border-2 ${borderCol} ${textColor} hover:border-red-600 transition-colors flex items-center gap-1.5 text-xs font-bold`}
            title="Switch Visual Palette"
          >
            <Sparkles size={16} />
            <span className="uppercase text-[11px]">{theme}</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`p-2.5 rounded border-2 ${borderCol} ${textColor} hover:border-red-600 transition-colors flex items-center gap-1`}
            title="Toggle Spaghetti Synth Soundtrack"
          >
            <Music size={16} className={isMusicActive ? 'text-red-600 animate-pulse' : 'opacity-40'} />
          </button>

          <button
            onClick={onToggleMute}
            className={`p-2.5 rounded border-2 ${borderCol} ${textColor} hover:border-red-600 transition-colors`}
            title="Mute / Unmute Audio"
          >
            {isMuted ? <VolumeX size={16} className="text-red-600" /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Inline SVG Title Lockup & Character Vignette */}
      <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto my-auto">
        {/* Animated Line Cowboy & Rearing Horse SVG Vignette (Faithfully recreating both attached images) */}
        <div className="relative mb-6">
          <svg
            width="220"
            height="180"
            viewBox="0 0 220 180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${textColor} transition-transform hover:scale-105 duration-300`}
          >
            {/* Radiating Red Sun (Directly from Image 2) */}
            <circle cx="45" cy="50" r="18" stroke="#dc2626" strokeWidth="3" />
            <line x1="45" y1="20" x2="45" y2="8" stroke="#dc2626" strokeWidth="3" />
            <line x1="68" y1="28" x2="76" y2="18" stroke="#dc2626" strokeWidth="3" />
            <line x1="22" y1="28" x2="14" y2="18" stroke="#dc2626" strokeWidth="3" />
            <line x1="72" y1="50" x2="84" y2="50" stroke="#dc2626" strokeWidth="3" />
            <line x1="18" y1="50" x2="6" y2="50" stroke="#dc2626" strokeWidth="3" />

            {/* Distant stick birds (from Image 2) */}
            <path d="M165 40 Q170 34 175 40 Q180 34 185 40" stroke="currentColor" strokeWidth="2" />
            <path d="M180 55 Q185 50 190 55 Q195 50 200 55" stroke="currentColor" strokeWidth="2" />

            {/* Rearing Horse (Directly from Image 2) */}
            <ellipse cx="115" cy="115" rx="34" ry="16" transform="rotate(-15 115 115)" />
            {/* Neck & Head */}
            <line x1="135" y1="105" x2="152" y2="55" />
            {/* Mane ticks */}
            <line x1="139" y1="95" x2="131" y2="92" />
            <line x1="143" y1="83" x2="135" y2="80" />
            <line x1="147" y1="71" x2="139" y2="68" />
            <line x1="150" y1="60" x2="142" y2="57" />
            {/* Horse head */}
            <ellipse cx="158" cy="50" rx="14" ry="8" transform="rotate(-35 158 50)" />
            {/* Legs */}
            <polyline points="135,125 150,145 162,165" /> {/* Front rearing leg */}
            <polyline points="95,125 90,150 82,170" />  {/* Hind leg */}
            <polyline points="105,125 102,148 98,168" />
            {/* Tail */}
            <line x1="82" y1="115" x2="60" y2="120" />

            {/* Cowboy Rider (From Image 1 & 2) */}
            {/* Torso */}
            <ellipse cx="120" cy="85" rx="8" ry="18" transform="rotate(10 120 85)" />
            {/* Head */}
            <ellipse cx="123" cy="55" rx="7" ry="10" />
            {/* Hat */}
            <line x1="102" y1="46" x2="144" y2="46" />
            <path d="M114 46 A 9 9 0 0 1 132 46" />
            {/* Holster on hip */}
            <polyline points="112,94 105,94 105,106 110,106 110,98" />
            {/* Arms: Left hand holding reins, Right hand waving/wielding Cutlas */}
            <polyline points="118,75 135,80 152,55" /> {/* Reins */}
            <polyline points="122,75 105,65 92,60" />  {/* Sword arm */}
            {/* Cutlas curved blade */}
            <path d="M92 60 Q70 48 55 58 Q72 65 92 60" stroke="#dc2626" strokeWidth="2.5" />
            {/* 3-finger splayed hand */}
            <line x1="92" y1="60" x2="86" y2="52" />
            <line x1="92" y1="60" x2="84" y2="62" />
            <line x1="92" y1="60" x2="88" y2="70" />

            {/* Horizon curve */}
            <path d="M20 170 Q110 162 200 170" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        </div>

        {/* Bespoke Inline SVG Title Lockup */}
        <h1 className="sr-only">CUTLAS</h1>
        <div className="w-full max-w-md px-4 mb-3">
          <svg
            viewBox="0 0 400 90"
            className="w-full h-auto overflow-visible"
            fill="none"
            stroke="currentColor"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            {/* Styled Line-Art Lettering for CUTLAS */}
            {/* C */}
            <path d="M60 20 H20 V70 H60" strokeWidth="7" className={textColor} />
            {/* U */}
            <path d="M80 20 V65 C80 70 85 70 95 70 C105 70 110 70 110 65 V20" strokeWidth="7" className={textColor} />
            {/* T */}
            <path d="M125 20 H165 M145 20 V70" strokeWidth="7" className={textColor} />
            {/* L */}
            <path d="M185 20 V70 H225" strokeWidth="7" className={textColor} />
            {/* A */}
            <path d="M245 70 L265 20 L285 70 M252 52 H278" strokeWidth="7" className={textColor} />
            {/* S */}
            <path d="M340 25 C340 20 305 20 305 35 C305 50 340 45 340 60 C340 72 305 72 305 65" strokeWidth="7" className={accentRed} />
            {/* Slicing Razor Line Strike through Title */}
            <line x1="10" y1="46" x2="385" y2="44" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        </div>

        <p className={`text-sm md:text-base font-medium max-w-md mb-8 ${subtleColor}`}>
          A pure line-art frontier action rogue. Slash with cutlas, draw your six-shooter, mount the rearing stallion, and upgrade your ink.
        </p>

        {/* Start CTA Button */}
        <button
          onClick={onStart}
          className={`px-8 py-3.5 rounded border-2 ${borderCol} ${textColor} hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 font-bold text-base tracking-wider shadow-md`}
        >
          <Play size={18} className="fill-current" />
          <span>START DUEL</span>
          <span className="text-xs opacity-60 font-mono">[SPACE / ENTER]</span>
        </button>

        {/* High Score Readout */}
        {highScore > 0 && (
          <div className="mt-5 flex items-center gap-2 text-xs font-bold">
            <span className={subtleColor}>FRONTIER RECORD:</span>
            <span className="text-amber-600 font-bold tabular-nums text-sm">{highScore} PTS</span>
          </div>
        )}
      </div>

      {/* Flat Single-Line Control Hint */}
      <div className={`w-full text-center text-xs md:text-sm py-2 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-stone-300 text-stone-600'}`}>
        <span>WASD Move</span>
        <span className="mx-2">·</span>
        <span>L-Click Slash / Shoot</span>
        <span className="mx-2">·</span>
        <span>R-Click Dash</span>
        <span className="mx-2">·</span>
        <span>Space / E Mount Horse</span>
        <span className="mx-2">·</span>
        <span>1 / 2 Switch Weapon</span>
        <span className="mx-2">·</span>
        <span>Esc Pause</span>
      </div>
    </div>
  );
};

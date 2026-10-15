import React from 'react';
import { VisualTheme } from '../types/game';
import { Play, RotateCcw, Volume2, VolumeX, Music } from 'lucide-react';

interface PauseModalProps {
  theme: VisualTheme;
  isMuted: boolean;
  isMusicActive: boolean;
  musicVolume: number;
  sfxVolume: number;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onMusicVolumeChange: (val: number) => void;
  onSfxVolumeChange: (val: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  theme,
  isMuted,
  isMusicActive,
  musicVolume,
  sfxVolume,
  onResume,
  onRestart,
  onToggleMute,
  onToggleMusic,
  onMusicVolumeChange,
  onSfxVolumeChange,
}) => {
  const isDark = theme === 'midnight';
  const textColor = isDark ? 'text-slate-100' : 'text-stone-900';
  const subtleColor = isDark ? 'text-slate-400' : 'text-stone-600';
  const borderCol = isDark ? 'border-slate-700' : 'border-stone-800';
  const bgCard = isDark ? 'bg-slate-900/95' : 'bg-[#fcfaf5]';

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-30 font-mono select-none">
      <div className={`w-full max-w-md p-6 md:p-8 rounded-lg border-2 ${borderCol} ${bgCard} shadow-2xl flex flex-col gap-6`}>
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-red-600 font-bold">
            GAME PAUSED
          </span>
          <h2 className={`text-2xl font-black mt-1 ${textColor}`}>
            FRONTIER INTERMISSION
          </h2>
        </div>

        {/* Audio Sliders & Synthesizer Settings */}
        <div className="flex flex-col gap-4 p-4 rounded border border-stone-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className={`font-bold ${textColor}`}>SYNTH MUSIC</span>
            <button
              onClick={onToggleMusic}
              className={`p-1.5 rounded border ${borderCol} ${textColor} flex items-center gap-1 font-bold text-[11px]`}
            >
              <Music size={14} className={isMusicActive ? 'text-red-600' : 'opacity-40'} />
              <span>{isMusicActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-red-600 cursor-pointer"
          />

          <div className="flex items-center justify-between mt-2">
            <span className={`font-bold ${textColor}`}>SOUND EFFECTS</span>
            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded border ${borderCol} ${textColor} flex items-center gap-1 font-bold text-[11px]`}
            >
              {isMuted ? <VolumeX size={14} className="text-red-600" /> : <Volume2 size={14} />}
              <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-red-600 cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className={`w-full py-3 rounded border-2 ${borderCol} ${textColor} hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center gap-2 font-bold text-sm tracking-wider shadow-sm`}
          >
            <Play size={16} />
            <span>RESUME DUEL</span>
          </button>

          <button
            onClick={onRestart}
            className={`w-full py-2.5 rounded border ${borderCol} ${subtleColor} hover:text-red-600 hover:border-red-600 transition-all flex items-center justify-center gap-2 font-bold text-xs tracking-wider`}
          >
            <RotateCcw size={14} />
            <span>ABANDON & RESTART</span>
          </button>
        </div>
      </div>
    </div>
  );
};

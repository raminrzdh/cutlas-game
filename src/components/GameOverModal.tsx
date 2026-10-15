import React, { useEffect } from 'react';
import { GameStats, VisualTheme } from '../types/game';
import { RotateCcw, Award } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  theme: VisualTheme;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  theme,
  onRestart,
}) => {
  const isDark = theme === 'midnight';
  const textColor = isDark ? 'text-slate-100' : 'text-stone-900';
  const subtleColor = isDark ? 'text-slate-400' : 'text-stone-600';
  const borderCol = isDark ? 'border-slate-700' : 'border-stone-800';
  const bgCard = isDark ? 'bg-slate-900/95' : 'bg-[#fcfaf5]';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-30 font-mono select-none">
      <div className={`w-full max-w-md p-6 md:p-8 rounded-lg border-2 ${borderCol} ${bgCard} shadow-2xl flex flex-col items-center text-center gap-6`}>
        {/* Tombstone / Wanted Poster Header */}
        <div className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-red-600 text-red-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-red-600 font-bold">
            DUEL CONCLUDED
          </span>
          <h2 className={`text-2xl md:text-3xl font-black mt-1 ${textColor}`}>
            FALLEN IN THE DUST
          </h2>
          <p className={`text-xs mt-1 ${subtleColor}`}>
            Your lines splintered on the desert floor.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={`w-full p-4 rounded border ${borderCol} grid grid-cols-2 gap-3 text-left text-xs`}>
          <div>
            <span className={`block ${subtleColor}`}>WAVE REACHED</span>
            <span className={`text-lg font-bold ${textColor} tabular-nums`}>{stats.wave}</span>
          </div>
          <div>
            <span className={`block ${subtleColor}`}>OUTLAWS SLAIN</span>
            <span className={`text-lg font-bold ${textColor} tabular-nums`}>{stats.kills}</span>
          </div>
          <div>
            <span className={`block ${subtleColor}`}>BOUNTY CASHED</span>
            <span className="text-lg font-bold text-amber-600 tabular-nums">${stats.bounty}</span>
          </div>
          <div>
            <span className={`block ${subtleColor}`}>SURVIVAL TIME</span>
            <span className={`text-lg font-bold ${textColor} tabular-nums`}>
              {Math.floor(stats.timeSurvived)}s
            </span>
          </div>
        </div>

        {/* High Score / Record */}
        <div className="flex items-center gap-2">
          {isNewHighScore ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 border border-amber-600/50 px-3 py-1 rounded bg-amber-500/10">
              <Award size={16} />
              <span>NEW RECORD: {stats.score} PTS!</span>
            </div>
          ) : (
            <div className={`text-xs font-bold ${subtleColor}`}>
              FRONTIER RECORD: <span className="text-amber-600">{stats.highScore} PTS</span>
            </div>
          )}
        </div>

        {/* Play Again CTA */}
        <button
          onClick={onRestart}
          className={`w-full py-3.5 rounded border-2 ${borderCol} ${textColor} hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center gap-2 font-bold text-sm tracking-wider shadow-md`}
        >
          <RotateCcw size={16} />
          <span>DRAW AGAIN</span>
          <span className="text-xs opacity-60 font-mono">[SPACE / ENTER]</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Play } from 'lucide-react';

interface SpriteSheetModalProps {
  onClose: () => void;
  onAdoptPose?: (pose: 'thinking' | 'shooting' | 'walking' | 'idle') => void;
}

export const SpriteSheetModal: React.FC<SpriteSheetModalProps> = ({ onClose, onAdoptPose }) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 font-mono select-none">
      <div className="w-full max-w-4xl p-6 md:p-8 rounded-lg border-4 border-stone-900 bg-[#fde047] shadow-2xl flex flex-col gap-6 text-stone-900">
        {/* Comic Strip Header */}
        <div className="flex items-start justify-between border-b-3 border-stone-900 pb-3">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-red-600 block">
              1990s AVANT-GARDE SPANISH COMIC STRIP
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-stone-900">
              EL BUENO DE CUTTLAS · CHARACTER POSES
            </h2>
            <p className="text-xs mt-1 text-stone-800 font-medium">
              Ultra-minimalist flat vector art inspired by Calpurnio's Cuttlas Microfilms. Pure flat 2D, zero shading.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-stone-900 bg-white hover:bg-stone-900 hover:text-white transition-colors cursor-pointer"
            title="Close Sprite Sheet"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Comic Panels representing the 4 requested poses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* POSE 1: IDLE (EXACT MATCH TO ATTACHED IMAGE.PNG) */}
          <div className="border-3 border-stone-900 bg-[#e29d33] p-3 flex flex-col items-center justify-between text-center min-h-[250px]">
            <span className="text-xs font-black tracking-widest uppercase bg-stone-900 text-white px-2 py-0.5 self-start">
              1. IDLE (IMAGE REF)
            </span>
            <svg width="120" height="150" viewBox="0 0 120 150" fill="none" className="my-auto">
              {/* Desert ground */}
              <line x1="0" y1="135" x2="120" y2="135" stroke="#111827" strokeWidth="2.5" />
              {/* Inverted V legs from bottom tip of oval torso */}
              <line x1="60" y1="100" x2="44" y2="135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="44" y1="135" x2="30" y2="135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="60" y1="100" x2="76" y2="135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="76" y1="135" x2="90" y2="135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              {/* Blocky '7' holster on hip */}
              <path d="M54 76 L42 76 L42 94 L47 94 L47 82 L54 82 Z" fill="#ffffff" stroke="#111827" strokeWidth="2.2" />
              {/* Elongated vertical oval torso from image.png */}
              <ellipse cx="60" cy="74" rx="8.5" ry="26" fill="#ffffff" stroke="#111827" strokeWidth="2.8" />
              {/* Left arm with 3-finger claw hand */}
              <line x1="56" y1="52" x2="26" y2="78" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="26" y1="78" x2="18" y2="84" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="26" y1="78" x2="16" y2="76" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="26" y1="78" x2="22" y2="71" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              {/* Right arm with 3-finger claw hand */}
              <line x1="64" y1="52" x2="94" y2="78" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="94" y1="78" x2="102" y2="84" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="94" y1="78" x2="104" y2="76" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="94" y1="78" x2="98" y2="71" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
              {/* Blank vertical oval head from image.png */}
              <ellipse cx="60" cy="38" rx="6.5" ry="10.5" fill="#ffffff" stroke="#111827" strokeWidth="2.6" />
              {/* Cowboy hat: straight horizontal line brim + dome crown */}
              <path d="M52 28 A 8 8 0 0 1 68 28 Z" fill="#ffffff" stroke="#111827" strokeWidth="2.6" />
              <line x1="42" y1="28" x2="78" y2="28" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-bold text-stone-900">Exact image.png match</span>
          </div>

          {/* POSE 2: WALKING (NATURAL 2D PROFILE WALK) */}
          <div className="border-3 border-stone-900 bg-[#e29d33] p-3 flex flex-col items-center justify-between text-center min-h-[250px]">
            <span className="text-xs font-black tracking-widest uppercase bg-stone-900 text-white px-2 py-0.5 self-start">
              2. 2D WALKING
            </span>
            <svg width="120" height="150" viewBox="0 0 120 150" fill="none" className="my-auto">
              {/* Desert ground */}
              <line x1="0" y1="135" x2="120" y2="135" stroke="#111827" strokeWidth="2.5" />
              {/* Back leg (stepping back, behind torso) */}
              <polyline points="58,98 42,120 32,135 22,135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              {/* Elongated vertical oval torso */}
              <ellipse cx="60" cy="73" rx="8.5" ry="26" fill="#ffffff" stroke="#111827" strokeWidth="2.8" />
              {/* Front leg (stepping forward in front of torso) */}
              <polyline points="62,98 78,118 86,131 96,131" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              {/* Front weapon arm holding revolver forward; back arm cleanly occluded behind oval torso */}
              <line x1="62" y1="52" x2="88" y2="68" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              {/* 3-finger hand holding revolver */}
              <line x1="88" y1="68" x2="85" y2="63" stroke="#111827" strokeWidth="1.8" />
              <line x1="88" y1="68" x2="89" y2="73" stroke="#111827" strokeWidth="1.8" />
              {/* Revolver */}
              <rect x="88" y="66" width="4" height="4" fill="#111827" />
              <rect x="92" y="67" width="8" height="2" fill="#111827" />
              {/* Blank vertical oval head */}
              <ellipse cx="61" cy="37" rx="6.5" ry="10.5" fill="#ffffff" stroke="#111827" strokeWidth="2.6" />
              {/* Hat */}
              <path d="M53 27 A 8 8 0 0 1 69 27 Z" fill="#ffffff" stroke="#111827" strokeWidth="2.6" />
              <line x1="43" y1="27" x2="79" y2="27" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-bold text-stone-900">2D Profile Walk (No back-arm peek)</span>
          </div>

          {/* POSE 3: SHOOTING */}
          <div className="border-3 border-stone-900 bg-[#e29d33] p-3 flex flex-col items-center justify-between text-center min-h-[250px]">
            <span className="text-xs font-black tracking-widest uppercase bg-stone-900 text-white px-2 py-0.5 self-start">
              3. SHOOTING
            </span>
            <svg width="120" height="150" viewBox="0 0 120 150" fill="none" className="my-auto">
              {/* Desert ground */}
              <line x1="0" y1="135" x2="120" y2="135" stroke="#111827" strokeWidth="2.5" />
              {/* Brace legs */}
              <polyline points="52,98 40,135 30,135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="64,98 76,135 88,135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              {/* Elongated oval torso */}
              <ellipse cx="58" cy="74" rx="8.5" ry="26" fill="#ffffff" stroke="#111827" strokeWidth="2.8" />
              {/* Aiming arm with revolver and 3-finger hand */}
              <line x1="60" y1="52" x2="88" y2="52" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="88" y1="52" x2="85" y2="48" stroke="#111827" strokeWidth="1.8" />
              <line x1="88" y1="52" x2="85" y2="56" stroke="#111827" strokeWidth="1.8" />
              <rect x="88" y="52" width="3" height="6" fill="#111827" />
              <rect x="88" y="49" width="5" height="5" fill="#111827" />
              <rect x="93" y="50" width="9" height="3" fill="#111827" />
              {/* Comic BANG! burst */}
              <path d="M106 46 L110 41 L112 45 L118 43 L115 48 L120 52 L114 53 L117 58 L111 56 L108 60 L107 54 Z" fill="#dc2626" stroke="#111827" strokeWidth="1" />
              {/* Blank vertical oval head */}
              <ellipse cx="56" cy="38" rx="6.5" ry="10.5" fill="#ffffff" stroke="#111827" strokeWidth="2.6" />
              {/* Hat */}
              <path d="M48 28 A 8 8 0 0 1 64 28 Z" fill="#ffffff" stroke="#111827" strokeWidth="2.6" />
              <line x1="38" y1="28" x2="74" y2="28" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-bold text-stone-900">Quick-draw [Click]</span>
          </div>

          {/* POSE 4: SITTING THINKING */}
          <div className="border-3 border-stone-900 bg-[#e29d33] p-3 flex flex-col items-center justify-between text-center min-h-[250px]">
            <span className="text-xs font-black tracking-widest uppercase bg-stone-900 text-white px-2 py-0.5 self-start">
              4. SITTING THINKING
            </span>
            <svg width="120" height="150" viewBox="0 0 120 150" fill="none" className="my-auto">
              {/* Ground */}
              <line x1="0" y1="135" x2="120" y2="135" stroke="#111827" strokeWidth="2.5" />
              {/* Sitting folded legs */}
              <polyline points="48,114 32,135 64,135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="58,114 70,108 74,135" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              {/* Tilted oval torso */}
              <g transform="rotate(-8 54 90)">
                <ellipse cx="54" cy="90" rx="8.5" ry="25" fill="#ffffff" stroke="#111827" strokeWidth="2.8" />
              </g>
              {/* Arm propping chin with 3-finger hand */}
              <polyline points="48,72 68,90 62,60" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="62" y1="60" x2="59" y2="56" stroke="#111827" strokeWidth="1.8" />
              <line x1="62" y1="60" x2="65" y2="56" stroke="#111827" strokeWidth="1.8" />
              {/* Thinking head */}
              <ellipse cx="56" cy="48" rx="6.5" ry="10.5" fill="#ffffff" stroke="#111827" strokeWidth="2.6" transform="rotate(-10 56 48)" />
              {/* Hat */}
              <g transform="rotate(-10 56 48)">
                <path d="M48 37 A 8 8 0 0 1 64 37 Z" fill="#ffffff" stroke="#111827" strokeWidth="2.6" />
                <line x1="38" y1="37" x2="74" y2="37" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
              </g>
              {/* Thought bubbles */}
              <circle cx="78" cy="40" r="3" stroke="#111827" strokeWidth="2" />
              <circle cx="88" cy="30" r="5" stroke="#111827" strokeWidth="2" />
              <text x="88" y="33" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#111827">?</text>
            </svg>
            <span className="text-[11px] font-bold text-stone-900">Philosopher [T]</span>
          </div>
        </div>

        {/* Footer controls & prompt */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t-3 border-stone-900 pt-3 gap-3">
          <div className="text-xs font-bold text-stone-800">
            Tip: Press <kbd className="px-1.5 py-0.5 border-2 border-stone-900 bg-white font-mono text-xs">T</kbd> during play to enter Cuttlas's iconic thinking pose!
          </div>
          <div className="flex items-center gap-2">
            {onAdoptPose && (
              <button
                onClick={() => {
                  onAdoptPose('thinking');
                  onClose();
                }}
                className="px-4 py-2 border-2 border-stone-900 bg-stone-900 text-white hover:bg-white hover:text-stone-900 transition-colors font-bold text-xs uppercase cursor-pointer"
              >
                Adopt Thinking Pose [T]
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-stone-900 bg-white text-stone-900 hover:bg-stone-900 hover:text-white transition-colors font-bold text-xs uppercase cursor-pointer"
            >
              Back to Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

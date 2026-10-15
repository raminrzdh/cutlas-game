/**
 * Cutlas - Minimalist Line Action Roguelite
 * Pure line art game inspired by authentic hand-drawn stick cowboy sketches
 * Procedural Web Audio Synth Engine & Western Soundtrack
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameStats, GameStateMode, Player, Upgrade, VisualTheme } from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SpriteSheetModal } from './components/SpriteSheetModal';
import { sound } from './audio/synthEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React state for UI overlays only (isolated from 60fps canvas loop)
  const [gameState, setGameState] = useState<GameStateMode>('title');
  const [theme, setTheme] = useState<VisualTheme>('calpurnio');
  const [showSpriteSheet, setShowSpriteSheet] = useState<boolean>(false);
  const [stats, setStats] = useState<GameStats>({
    bounty: 0,
    score: 0,
    wave: 1,
    kills: 0,
    slashes: 0,
    shotsFired: 0,
    shotsHit: 0,
    chivalryActs: 0,
    timeSurvived: 0,
    highScore: 0,
  });
  const [playerState, setPlayerState] = useState<Player | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicActive, setIsMusicActive] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.5);
  const [sfxVolume, setSfxVolume] = useState<number>(0.8);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onStateChange: (newState) => {
        setGameState(newState);
      },
      onUpgradeSelect: (options) => {
        setUpgradeOptions(options);
      },
      onStatsUpdate: (newStats, player) => {
        // Debounce / direct sync player & stats snapshot
        setStats({ ...newStats });
        setPlayerState({ ...player });
      },
      onWaveComplete: (_wave) => {
        // Handled by upgrade trigger
      },
    });

    engine.setTheme(theme);
    engine.startLoop();
    engineRef.current = engine;

    return () => {
      engine.stopLoop();
      sound.stopMusic();
    };
  }, []);

  // Sync theme changes to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTheme(theme);
    }
  }, [theme]);

  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startNewGame();
      setIsMusicActive(sound.isMusicActive());
    }
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'calpurnio') return 'ink';
      if (prev === 'ink') return 'midnight';
      if (prev === 'midnight') return 'sepia';
      return 'calpurnio';
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMute(nextMuted);
  }, [isMuted]);

  const handleToggleMusic = useCallback(() => {
    const active = sound.toggleMusic();
    setIsMusicActive(active);
  }, []);

  const handleMusicVolumeChange = useCallback((val: number) => {
    setMusicVolume(val);
    sound.setMusicVolume(val);
  }, []);

  const handleSfxVolumeChange = useCallback((val: number) => {
    setSfxVolume(val);
    sound.setSfxVolume(val);
  }, []);

  const handleTogglePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  }, []);

  const handleUpgradeSelect = useCallback((upgrade: Upgrade) => {
    if (engineRef.current) {
      engineRef.current.applyUpgrade(upgrade);
    }
  }, []);

  const handleMountToggle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.toggleHorseMount();
    }
  }, []);

  const handleWeaponSwitch = useCallback((w: 'cutlas' | 'revolver') => {
    if (engineRef.current) {
      engineRef.current.player.weapon = w;
    }
  }, []);

  const handleAdoptPose = useCallback((pose: 'thinking' | 'shooting' | 'walking' | 'idle') => {
    if (engineRef.current) {
      if (pose === 'thinking') {
        engineRef.current.player.isThinking = true;
      } else {
        engineRef.current.player.isThinking = false;
      }
    }
  }, []);

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${theme === 'calpurnio' ? 'bg-[#fde047]' : theme === 'midnight' ? 'bg-[#0c0f12]' : 'bg-[#f7f4ed]'} select-none font-mono`}>
      {/* 60fps Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          theme={theme}
          highScore={stats.highScore}
          isMuted={isMuted}
          isMusicActive={isMusicActive}
          onStart={handleStartGame}
          onToggleTheme={handleToggleTheme}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onOpenSpriteSheet={() => setShowSpriteSheet(true)}
        />
      )}

      {/* In-Game HUD (Low-occlusion, perimeter readouts) */}
      {(gameState === 'playing' || gameState === 'paused') && playerState && (
        <HUD
          player={playerState}
          stats={stats}
          theme={theme}
          isPaused={gameState === 'paused'}
          isMuted={isMuted}
          isMusicActive={isMusicActive}
          onTogglePause={handleTogglePause}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onToggleTheme={handleToggleTheme}
          onMountToggle={handleMountToggle}
          onWeaponSwitch={handleWeaponSwitch}
        />
      )}

      {/* Saloon Upgrade Draft Screen */}
      {gameState === 'upgrade' && (
        <UpgradeModal
          options={upgradeOptions}
          theme={theme}
          wave={stats.wave}
          onSelect={handleUpgradeSelect}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          theme={theme}
          isMuted={isMuted}
          isMusicActive={isMusicActive}
          musicVolume={musicVolume}
          sfxVolume={sfxVolume}
          onResume={handleTogglePause}
          onRestart={handleStartGame}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onMusicVolumeChange={handleMusicVolumeChange}
          onSfxVolumeChange={handleSfxVolumeChange}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          theme={theme}
          onRestart={handleStartGame}
        />
      )}

      {/* Calpurnio Sprite Sheet & Poses Modal */}
      {showSpriteSheet && (
        <SpriteSheetModal
          onClose={() => setShowSpriteSheet(false)}
          onAdoptPose={handleAdoptPose}
        />
      )}
    </div>
  );
}

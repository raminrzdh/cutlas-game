export type WeaponType = 'cutlas' | 'revolver' | 'dual_cutlas' | 'shotgun' | 'razor_wave';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'mount' | 'defense' | 'utility';
  level: number;
  maxLevel: number;
  cost: number;
  iconType: string;
  apply: (state: GameContextState) => void;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // aiming angle
  moveAngle: number;
  speed: number;
  maxHp: number;
  hp: number;
  radius: number;
  isMounted: boolean;
  horseUnlocked: boolean;
  horseStamina: number;
  maxHorseStamina: number;
  invulnerableTimer: number;
  dashTimer: number;
  dashCooldown: number;
  isDashing: boolean;
  
  // Weapon stats
  weapon: WeaponType;
  slashCooldown: number;
  slashTimer: number;
  slashRange: number;
  slashArc: number;
  slashDamage: number;
  isSlashing: boolean;
  slashSwingDir: number; // 1 or -1
  slashProgress: number; // 0 to 1
  
  gunCooldown: number;
  gunTimer: number;
  gunDamage: number;
  gunAmmo: number;
  maxGunAmmo: number;
  gunReloadTimer: number;
  
  // Upgrades & Perks
  lineThickness: number;
  ricochetCount: number;
  razorWave: boolean;
  dynamiteUnlocked: boolean;
  dynamiteCooldown: number;
  dynamiteTimer: number;
  magnetRange: number;
  criticalChance: number;
  walkCycle: number;
  horseGallopCycle: number;
}

export type EnemyType = 'scout' | 'bandit' | 'vulture' | 'snake' | 'brute' | 'rider' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  hp: number;
  maxHp: number;
  radius: number;
  angle: number;
  attackCooldown: number;
  attackTimer: number;
  windupTimer: number;
  isAttacking: boolean;
  walkCycle: number;
  bountyValue: number;
  lineThickness: number;
  shootTimer?: number;
  targetOffset?: { x: number; y: number };
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  length: number;
  damage: number;
  isPlayer: boolean;
  bouncesLeft: number;
  life: number;
  maxLife: number;
  pierce: number;
  isRazorWave?: boolean;
  isDynamite?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  angle: number;
  vAngle: number;
  color?: string;
  lineWidth: number;
  life: number;
  maxLife: number;
  type: 'line' | 'spark' | 'smoke' | 'blood' | 'dust' | 'text';
  text?: string;
}

export interface BountyItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  life: number;
  collected: boolean;
}

export interface Tumbleweed {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  rotSpeed: number;
}

export interface CloudBird {
  x: number;
  y: number;
  vx: number;
  wingAngle: number;
  flapSpeed: number;
  scale: number;
}

export interface GameStats {
  bounty: number;
  score: number;
  wave: number;
  kills: number;
  slashes: number;
  shotsFired: number;
  shotsHit: number;
  timeSurvived: number;
  highScore: number;
}

export interface GameContextState {
  player: Player;
  stats: GameStats;
  screenShake: number;
  hitStopTimer: number;
}

export type GameStateMode = 'title' | 'playing' | 'upgrade' | 'paused' | 'gameover' | 'victory';

export type VisualTheme = 'ink' | 'midnight' | 'sepia';

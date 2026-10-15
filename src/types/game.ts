export type WeaponType = 'revolver' | 'cutlas' | 'dual_cutlas' | 'shotgun' | 'razor_wave';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'mount' | 'defense' | 'utility' | 'dog';
  level: number;
  maxLevel: number;
  cost: number;
  iconType: string;
  apply: (state: GameContextState) => void;
}

export interface DogCompanion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  walkCycle: number;
  tailWag: number;
  state: 'follow' | 'fetch' | 'attack' | 'happy';
  targetBountyId: number | null;
  targetEnemyId: number | null;
  level: number;
  fetchSpeed: number;
  biteDamage: number;
  barkCooldown: number;
  barkTimer: number;
  biteCooldown: number;
  biteTimer: number;
  chivalryAura: boolean;
  carryingBountyValue: number;
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
  quickDrawTimer: number; // holster draw recoil/flash
  isThinking: boolean; // Calpurnio philosophical sitting/thinking pose
  
  // Loyal White Dog Companion
  dog: DogCompanion;

  // Upgrades & Perks
  lineThickness: number;
  ricochetCount: number;
  razorWave: boolean;
  dynamiteUnlocked: boolean;
  dynamiteCooldown: number;
  dynamiteTimer: number;
  magnetRange: number;
  criticalChance: number;
  chivalryKindness: number; // healing aura / hearts
  walkCycle: number;
  horseGallopCycle: number;
  facingDir: number; // 1 (right) or -1 (left)
  currentYaw: number; // 0 to Math.PI (interpolates across 4 frames during turn)
  timeSec: number;
  isGrounded?: boolean;
}

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wood' | 'rock' | 'roof';
  label?: string;
}

export type EnemyType = 'scout' | 'bandit' | 'vulture' | 'snake' | 'brute' | 'rider' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  characterIdentity?: 'cuttlas' | 'jim' | 'jak' | 'juan_bala' | 'alien_37' | 'bandit';
  facingDir: number;
  currentYaw: number;
  timeSec: number;
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
  type: 'line' | 'spark' | 'smoke' | 'blood' | 'dust' | 'text' | 'heart' | 'bang';
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
  chivalryActs: number;
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

export type VisualTheme = 'calpurnio' | 'ink' | 'midnight' | 'sepia';

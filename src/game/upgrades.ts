import { Upgrade, GameContextState } from '../types/game';

export const ALL_UPGRADES: Upgrade[] = [
  {
    id: 'loyal_dog',
    name: 'Loyal White Dog Mastery',
    description: "Empowers Kotlas's loyal white dog companion! Sprints 40% faster to fetch dropped bounty coins, stuns outlaws with fierce barks, and bites nearby foes.",
    category: 'dog',
    level: 0,
    maxLevel: 3,
    cost: 35,
    iconType: 'dog',
    apply: (state: GameContextState) => {
      state.player.dog.level++;
      state.player.dog.fetchSpeed += 80;
      state.player.dog.biteDamage += 15;
      state.player.dog.barkCooldown = Math.max(1.5, state.player.dog.barkCooldown - 0.5);
    },
  },
  {
    id: 'chivalric_heart',
    name: 'Chivalric Heart of Kotlas',
    description: 'Solves hardships with nobility and kindness. Emits soothing waves of affection that charm bandits, restores 1 HP periodically, and leaves floating hearts.',
    category: 'utility',
    level: 0,
    maxLevel: 3,
    cost: 40,
    iconType: 'heart',
    apply: (state: GameContextState) => {
      state.player.chivalryKindness += 1;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
    },
  },
  {
    id: 'horse_mount',
    name: 'The Rearing Stallion',
    description: 'Mount the iconic rearing horse from the sketchbook! Trample enemies on contact and gallop across the frontier.',
    category: 'mount',
    level: 0,
    maxLevel: 1,
    cost: 50,
    iconType: 'horse',
    apply: (state: GameContextState) => {
      state.player.horseUnlocked = true;
      state.player.isMounted = true;
      state.player.speed = Math.max(state.player.speed, 280);
    },
  },
  {
    id: 'quick_draw',
    name: 'Hip Holster Quick-Draw',
    description: "Master Kotlas's lightning draw from his side holster. +2 Max Ammo, 40% faster hammer cocking, and high-velocity line bullets.",
    category: 'weapon',
    level: 0,
    maxLevel: 3,
    cost: 35,
    iconType: 'revolver',
    apply: (state: GameContextState) => {
      state.player.maxGunAmmo += 2;
      state.player.gunAmmo = state.player.maxGunAmmo;
      state.player.gunCooldown *= 0.72;
      state.player.gunDamage += 12;
    },
  },
  {
    id: 'dual_cutlas',
    name: 'Twin Cutlasses',
    description: 'Equip a second curved cutlas. Doubles slash rate, widens sweep arc, and creates devastating cross-combos.',
    category: 'weapon',
    level: 0,
    maxLevel: 2,
    cost: 40,
    iconType: 'dual_sword',
    apply: (state: GameContextState) => {
      state.player.weapon = 'dual_cutlas';
      state.player.slashCooldown *= 0.65;
      state.player.slashArc = Math.PI * 0.95;
      state.player.slashDamage += 12;
    },
  },
  {
    id: 'razor_wave',
    name: 'Razor Wind Slices',
    description: 'Each cutlas swing unleashes a whistling razor wind line that pierces through multiple incoming bandits.',
    category: 'weapon',
    level: 0,
    maxLevel: 3,
    cost: 45,
    iconType: 'razor_wave',
    apply: (state: GameContextState) => {
      state.player.razorWave = true;
      state.player.slashDamage += 8;
    },
  },
  {
    id: 'ricochet',
    name: 'Frontier Ricochet',
    description: 'Fired bullets and razor lines bounce off screen edges to slice retreating outlaws.',
    category: 'weapon',
    level: 0,
    maxLevel: 3,
    cost: 30,
    iconType: 'ricochet',
    apply: (state: GameContextState) => {
      state.player.ricochetCount += 1;
    },
  },
  {
    id: 'thick_ink',
    name: 'Line Fortitude (Armor)',
    description: 'Reinforces Kotlas with crisp bold ink contours. +2 Max HP and fully restores health.',
    category: 'defense',
    level: 0,
    maxLevel: 4,
    cost: 35,
    iconType: 'armor',
    apply: (state: GameContextState) => {
      state.player.maxHp += 2;
      state.player.hp = state.player.maxHp;
      state.player.lineThickness = Math.min(4.5, state.player.lineThickness + 0.5);
    },
  },
  {
    id: 'spurs_of_haste',
    name: 'Silver Spurs',
    description: 'Increases sprint speed by 25% and reduces dodge dash cooldown, leaving ink ghost afterimages.',
    category: 'utility',
    level: 0,
    maxLevel: 3,
    cost: 25,
    iconType: 'spurs',
    apply: (state: GameContextState) => {
      state.player.speed *= 1.2;
      state.player.dashCooldown *= 0.8;
    },
  },
  {
    id: 'dynamite',
    name: 'Ticking Dynamite',
    description: 'Unlock dynamite throwing. Detonates in a high-powered starburst of splintered line shrapnel.',
    category: 'weapon',
    level: 0,
    maxLevel: 2,
    cost: 50,
    iconType: 'dynamite',
    apply: (state: GameContextState) => {
      state.player.dynamiteUnlocked = true;
      state.player.dynamiteCooldown *= 0.8;
    },
  },
  {
    id: 'bounty_magnet',
    name: 'Lasso Magnet',
    description: 'Expands your bounty collection lasso radius by 100%, vacuuming ink coins from across the screen.',
    category: 'utility',
    level: 0,
    maxLevel: 3,
    cost: 20,
    iconType: 'magnet',
    apply: (state: GameContextState) => {
      state.player.magnetRange += 120;
    },
  },
  {
    id: 'sharpened_steel',
    name: 'Honed Edge',
    description: '+30% Base Damage on all strikes and shots, plus +15% Critical Strike chance.',
    category: 'weapon',
    level: 0,
    maxLevel: 3,
    cost: 35,
    iconType: 'crit',
    apply: (state: GameContextState) => {
      state.player.slashDamage = Math.round(state.player.slashDamage * 1.3);
      state.player.gunDamage = Math.round(state.player.gunDamage * 1.3);
      state.player.criticalChance += 0.15;
    },
  },
];

export function getRandomUpgrades(count: number, currentUpgrades: Upgrade[]): Upgrade[] {
  // Filter upgrades that haven't reached maxLevel
  const available = ALL_UPGRADES.filter((u) => {
    const existing = currentUpgrades.find((curr) => curr.id === u.id);
    const currLevel = existing ? existing.level : 0;
    return currLevel < u.maxLevel;
  });

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

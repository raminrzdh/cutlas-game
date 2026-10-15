import {
  Player,
  Enemy,
  Projectile,
  Particle,
  BountyItem,
  Tumbleweed,
  CloudBird,
  GameStats,
  GameStateMode,
  Upgrade,
  VisualTheme,
} from '../types/game';
import { LineRenderer } from './renderer';
import { sound } from '../audio/synthEngine';
import { ALL_UPGRADES, getRandomUpgrades } from './upgrades';

export interface GameCallbacks {
  onStateChange: (state: GameStateMode) => void;
  onUpgradeSelect: (options: Upgrade[]) => void;
  onStatsUpdate: (stats: GameStats, player: Player) => void;
  onWaveComplete: (wave: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: LineRenderer;
  private callbacks: GameCallbacks;

  // Viewport
  public width: number = window.innerWidth;
  public height: number = window.innerHeight;
  public cameraX: number = 0;
  public cameraY: number = 0;
  private screenShake: number = 0;
  private hitStopTimer: number = 0;

  // Game Loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  public state: GameStateMode = 'title';

  // Entities
  public player!: Player;
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public bounties: BountyItem[] = [];
  public tumbleweeds: Tumbleweed[] = [];
  public birds: CloudBird[] = [];

  // Wave & Spawning
  public currentWave: number = 1;
  public waveTimer: number = 0;
  public waveEnemiesRemaining: number = 0;
  public waveActive: boolean = false;
  private spawnCooldown: number = 0;
  private nextEnemyId: number = 1;
  private nextProjId: number = 1;
  private nextBountyId: number = 1;

  // Input states
  private keys: Record<string, boolean> = {};
  public mouseX: number = 0;
  public mouseY: number = 0;
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;

  // Stats
  public stats: GameStats = {
    bounty: 0,
    score: 0,
    wave: 1,
    kills: 0,
    slashes: 0,
    shotsFired: 0,
    shotsHit: 0,
    timeSurvived: 0,
    highScore: 0,
  };

  public currentUpgrades: Upgrade[] = [];
  private gallopTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new LineRenderer(this.ctx);
    this.callbacks = callbacks;

    this.loadHighScore();
    this.handleResize();
    this.initWorldDecor();
    this.resetPlayer();

    window.addEventListener('resize', this.handleResize);
    this.setupInputs();
  }

  public setTheme(theme: VisualTheme) {
    this.renderer.theme = theme;
  }

  public getTheme(): VisualTheme {
    return this.renderer.theme;
  }

  private loadHighScore() {
    try {
      const saved = localStorage.getItem('cutlas_high_score');
      if (saved) {
        this.stats.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      // Ignore localStorage issues
    }
  }

  private saveHighScore() {
    try {
      if (this.stats.score > this.stats.highScore) {
        this.stats.highScore = this.stats.score;
        localStorage.setItem('cutlas_high_score', this.stats.highScore.toString());
      }
    } catch {
      // Ignore
    }
  }

  public handleResize = () => {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  };

  private initWorldDecor() {
    // Background Birds
    this.birds = [];
    for (let i = 0; i < 5; i++) {
      this.birds.push({
        x: Math.random() * this.width,
        y: 60 + Math.random() * 120,
        vx: 20 + Math.random() * 30,
        wingAngle: Math.random() * Math.PI * 2,
        flapSpeed: 4 + Math.random() * 3,
        scale: 0.6 + Math.random() * 0.6,
      });
    }

    // Tumbleweeds
    this.tumbleweeds = [];
    for (let i = 0; i < 6; i++) {
      this.tumbleweeds.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        vx: 40 + Math.random() * 50,
        vy: (Math.random() - 0.5) * 15,
        radius: 12 + Math.random() * 10,
        angle: 0,
        rotSpeed: 2 + Math.random() * 3,
      });
    }
  }

  public resetPlayer() {
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      moveAngle: 0,
      speed: 210,
      maxHp: 6,
      hp: 6,
      radius: 18,
      isMounted: false,
      horseUnlocked: false,
      horseStamina: 100,
      maxHorseStamina: 100,
      invulnerableTimer: 0,
      dashTimer: 0,
      dashCooldown: 1.2,
      isDashing: false,

      weapon: 'cutlas',
      slashCooldown: 0.32,
      slashTimer: 0,
      slashRange: 55,
      slashArc: Math.PI * 0.75,
      slashDamage: 25,
      isSlashing: false,
      slashSwingDir: 1,
      slashProgress: 0,

      gunCooldown: 0.38,
      gunTimer: 0,
      gunDamage: 20,
      gunAmmo: 6,
      maxGunAmmo: 6,
      gunReloadTimer: 0,

      lineThickness: 2.2,
      ricochetCount: 0,
      razorWave: false,
      dynamiteUnlocked: false,
      dynamiteCooldown: 5.0,
      dynamiteTimer: 0,
      magnetRange: 140,
      criticalChance: 0.05,
      walkCycle: 0,
      horseGallopCycle: 0,
    };
  }

  public startNewGame() {
    this.resetPlayer();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.bounties = [];
    this.currentUpgrades = [];
    this.currentWave = 1;
    this.waveActive = true;
    this.waveTimer = 0;
    this.waveEnemiesRemaining = 10;
    this.stats = {
      bounty: 0,
      score: 0,
      wave: 1,
      kills: 0,
      slashes: 0,
      shotsFired: 0,
      shotsHit: 0,
      timeSurvived: 0,
      highScore: this.stats.highScore,
    };

    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    sound.startMusic();
  }

  public startLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.lastTime = performance.now();
    const loop = (currentTime: number) => {
      const rawDt = (currentTime - this.lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // Clamp frame delta
      this.lastTime = currentTime;

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // --- Input Handlers ---

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        this.togglePause();
      }

      // Switch Weapon (1 = Cutlas, 2 = Revolver)
      if (e.key === '1') {
        this.player.weapon = this.player.razorWave ? 'razor_wave' : 'cutlas';
      } else if (e.key === '2') {
        this.player.weapon = 'revolver';
      }

      // Toggle Horse Mount (Space or E when horse unlocked)
      if ((e.key === 'e' || e.key === 'E' || (e.code === 'Space' && this.player.horseUnlocked)) && this.state === 'playing') {
        if (this.player.horseUnlocked) {
          this.toggleHorseMount();
        }
      }

      // Throw Dynamite (Q)
      if ((e.key === 'q' || e.key === 'Q') && this.player.dynamiteUnlocked && this.state === 'playing') {
        this.throwDynamite();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (this.state !== 'playing') return;
      if (e.button === 0) {
        this.isMouseDown = true;
        this.performPrimaryAttack();
      } else if (e.button === 2) {
        e.preventDefault();
        this.isRightMouseDown = true;
        this.performDash();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
      if (e.button === 2) this.isRightMouseDown = false;
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.isMouseDown = false;
      this.isRightMouseDown = false;
    });
  }

  public togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.callbacks.onStateChange('paused');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.callbacks.onStateChange('playing');
    }
  }

  public toggleHorseMount() {
    if (!this.player.horseUnlocked) return;
    this.player.isMounted = !this.player.isMounted;
    if (this.player.isMounted) {
      sound.playHorseWhinny();
      this.createShockwave(this.player.x, this.player.y, 40);
    }
  }

  // --- Combat Actions ---

  public performPrimaryAttack() {
    if (this.player.weapon === 'revolver') {
      this.fireRevolver();
    } else {
      this.performSlash();
    }
  }

  public performSlash() {
    if (this.player.slashTimer > 0) return;

    this.player.slashTimer = this.player.slashCooldown;
    this.player.isSlashing = true;
    this.player.slashProgress = 0;
    this.player.slashSwingDir *= -1; // alternate swing left/right
    this.stats.slashes++;

    sound.playSlash(this.player.isMounted ? 0.9 : 1.0);

    // If Razor Wave is unlocked, release a cutting line projectile!
    if (this.player.razorWave) {
      const angle = this.player.angle;
      this.projectiles.push({
        id: this.nextProjId++,
        x: this.player.x + Math.cos(angle) * 20,
        y: this.player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * 480,
        vy: Math.sin(angle) * 480,
        radius: 20,
        length: 24,
        damage: Math.round(this.player.slashDamage * 0.8),
        isPlayer: true,
        bouncesLeft: this.player.ricochetCount,
        life: 1.4,
        maxLife: 1.4,
        pierce: 3,
        isRazorWave: true,
      });
    }

    // Check melee collisions in slash arc
    const slashRange = this.player.slashRange * (this.player.isMounted ? 1.3 : 1.0);
    const halfArc = this.player.slashArc / 2;

    this.enemies.forEach((enemy) => {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= slashRange + enemy.radius) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = enemyAngle - this.player.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) <= halfArc + 0.3) {
          // HIT!
          const isCrit = Math.random() < this.player.criticalChance;
          const damage = Math.round(this.player.slashDamage * (isCrit ? 2.0 : 1.0));
          this.damageEnemy(enemy, damage, isCrit, Math.cos(this.player.angle) * 180, Math.sin(this.player.angle) * 180);
          this.triggerHitStop(0.04);
          this.addScreenShake(isCrit ? 10 : 5);
        }
      }
    });
  }

  public fireRevolver() {
    if (this.player.gunTimer > 0) return;
    if (this.player.gunAmmo <= 0) {
      // Auto reload
      if (this.player.gunReloadTimer <= 0) {
        this.player.gunReloadTimer = 1.0;
        this.addFloatingText(this.player.x, this.player.y - 30, 'RELOADING...', '#71717a');
      }
      return;
    }

    this.player.gunAmmo--;
    this.player.gunTimer = this.player.gunCooldown;
    this.stats.shotsFired++;
    sound.playGunshot();
    this.addScreenShake(3);

    const angle = this.player.angle + (Math.random() - 0.5) * 0.05;
    const speed = 720;

    this.projectiles.push({
      id: this.nextProjId++,
      x: this.player.x + Math.cos(angle) * 22,
      y: this.player.y + Math.sin(angle) * 22,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4,
      length: 14,
      damage: this.player.gunDamage,
      isPlayer: true,
      bouncesLeft: this.player.ricochetCount,
      life: 1.5,
      maxLife: 1.5,
      pierce: 1,
    });

    // Muzzle smoke particle
    this.particles.push({
      x: this.player.x + Math.cos(angle) * 25,
      y: this.player.y + Math.sin(angle) * 25,
      vx: Math.cos(angle) * 30,
      vy: Math.sin(angle) * 30,
      length: 8,
      angle: 0,
      vAngle: 0,
      lineWidth: 1.5,
      life: 0.25,
      maxLife: 0.25,
      type: 'smoke',
    });
  }

  public performDash() {
    if (this.player.dashTimer > 0) return;

    this.player.dashTimer = this.player.dashCooldown;
    this.player.isDashing = true;
    this.player.invulnerableTimer = 0.28;
    sound.playDash();

    // Dash burst vector
    const dashDir = (this.player.vx !== 0 || this.player.vy !== 0)
      ? Math.atan2(this.player.vy, this.player.vx)
      : this.player.angle;

    const dashSpeed = this.player.speed * (this.player.isMounted ? 2.5 : 2.2);
    this.player.vx = Math.cos(dashDir) * dashSpeed;
    this.player.vy = Math.sin(dashDir) * dashSpeed;

    // Line ghost burst
    this.createShockwave(this.player.x, this.player.y, 25);
  }

  public throwDynamite() {
    if (this.player.dynamiteTimer > 0) return;
    this.player.dynamiteTimer = this.player.dynamiteCooldown;

    const angle = this.player.angle;
    const speed = 360;

    this.projectiles.push({
      id: this.nextProjId++,
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 8,
      length: 12,
      damage: 80,
      isPlayer: true,
      bouncesLeft: 0,
      life: 1.2,
      maxLife: 1.2,
      pierce: 0,
      isDynamite: true,
    });
  }

  // --- Damage, Enemies & Loot ---

  public damageEnemy(enemy: Enemy, damage: number, isCrit: boolean, knockbackX: number = 0, knockbackY: number = 0) {
    enemy.hp -= damage;
    enemy.vx += knockbackX;
    enemy.vy += knockbackY;
    sound.playHit(isCrit);

    // Floating damage text
    this.addFloatingText(
      enemy.x + (Math.random() - 0.5) * 20,
      enemy.y - 25,
      isCrit ? `CRIT ${damage}!` : `${damage}`,
      isCrit ? '#dc2626' : undefined
    );

    // Line splinter particles
    this.createLineSplinters(enemy.x, enemy.y, 6, isCrit ? '#dc2626' : undefined);

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    this.stats.kills++;
    this.stats.score += enemy.bountyValue * 10;
    this.createLineSplinters(enemy.x, enemy.y, 14);

    // Drop bounty ink coin
    this.bounties.push({
      id: this.nextBountyId++,
      x: enemy.x,
      y: enemy.y,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      value: enemy.bountyValue,
      life: 25,
      collected: false,
    });

    // Remove from array
    this.enemies = this.enemies.filter((e) => e.id !== enemy.id);
  }

  public damagePlayer(amount: number) {
    if (this.player.invulnerableTimer > 0) return;

    this.player.hp -= amount;
    this.player.invulnerableTimer = 0.8;
    this.triggerHitStop(0.06);
    this.addScreenShake(14);
    sound.playHit(true);

    this.createLineSplinters(this.player.x, this.player.y, 10, '#dc2626');
    this.addFloatingText(this.player.x, this.player.y - 30, `-${amount} HP`, '#dc2626');

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.gameOver();
    }
  }

  private gameOver() {
    this.state = 'gameover';
    this.saveHighScore();
    sound.stopMusic();
    this.callbacks.onStateChange('gameover');
  }

  // --- Wave Management ---

  private updateWave(dt: number) {
    if (!this.waveActive) return;

    this.waveTimer += dt;
    this.spawnCooldown -= dt;

    // Check if wave is cleared
    if (this.waveEnemiesRemaining <= 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.stats.wave = this.currentWave;
      this.callbacks.onWaveComplete(this.currentWave);

      // Trigger Saloon Upgrade selection!
      const choices = getRandomUpgrades(3, this.currentUpgrades);
      if (choices.length > 0) {
        this.state = 'upgrade';
        this.callbacks.onStateChange('upgrade');
        this.callbacks.onUpgradeSelect(choices);
        sound.playUpgradeFanfare();
      } else {
        // Next wave directly
        this.startNextWave();
      }
      return;
    }

    // Spawn enemies if remaining
    if (this.waveEnemiesRemaining > 0 && this.spawnCooldown <= 0) {
      this.spawnEnemyForWave(this.currentWave);
      this.waveEnemiesRemaining--;
      // Escalating spawn rate
      this.spawnCooldown = Math.max(0.6, 2.2 - this.currentWave * 0.15);
    }
  }

  public startNextWave() {
    this.currentWave++;
    this.stats.wave = this.currentWave;
    this.waveActive = true;
    this.waveTimer = 0;
    this.waveEnemiesRemaining = 8 + this.currentWave * 4;

    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.addFloatingText(this.player.x, this.player.y - 50, `WAVE ${this.currentWave} APPROACHES`, '#dc2626');
  }

  public applyUpgrade(upgrade: Upgrade) {
    const existing = this.currentUpgrades.find((u) => u.id === upgrade.id);
    if (existing) {
      existing.level++;
      existing.apply({
        player: this.player,
        stats: this.stats,
        screenShake: this.screenShake,
        hitStopTimer: this.hitStopTimer,
      });
    } else {
      upgrade.level = 1;
      upgrade.apply({
        player: this.player,
        stats: this.stats,
        screenShake: this.screenShake,
        hitStopTimer: this.hitStopTimer,
      });
      this.currentUpgrades.push(upgrade);
    }

    sound.playUpgradeFanfare();
    this.startNextWave();
  }

  private spawnEnemyForWave(wave: number) {
    // Determine spawn location just off-screen
    const spawnAngle = Math.random() * Math.PI * 2;
    const dist = Math.max(this.width, this.height) * 0.65 + 100;
    const x = this.player.x + Math.cos(spawnAngle) * dist;
    const y = this.player.y + Math.sin(spawnAngle) * dist;

    // Pick enemy type based on wave
    let type: Enemy['type'] = 'bandit';
    const roll = Math.random();

    if (wave >= 5 && wave % 5 === 0 && this.waveEnemiesRemaining === 1) {
      type = 'boss';
    } else if (wave >= 4 && roll < 0.25) {
      type = 'rider';
    } else if (wave >= 3 && roll < 0.35) {
      type = 'vulture';
    } else if (wave >= 2 && roll < 0.5) {
      type = 'snake';
    } else if (roll < 0.3) {
      type = 'scout';
    }

    let hp = 40 + wave * 8;
    let speed = 120 + Math.random() * 40;
    let radius = 18;
    let bounty = 1 + Math.floor(wave / 2);

    if (type === 'boss') {
      hp = 450 + wave * 80;
      speed = 90;
      radius = 42;
      bounty = 25;
      this.addFloatingText(this.player.x, this.player.y - 70, 'OUTLAW BOSS: EL DIABLO!', '#dc2626');
      sound.playHit(true);
    } else if (type === 'rider') {
      hp = 70 + wave * 10;
      speed = 210;
      radius = 24;
      bounty = 4;
    } else if (type === 'vulture') {
      hp = 30 + wave * 5;
      speed = 190;
      radius = 16;
      bounty = 2;
    } else if (type === 'snake') {
      hp = 25 + wave * 4;
      speed = 170;
      radius = 14;
      bounty = 2;
    } else if (type === 'scout') {
      hp = 35 + wave * 5;
      speed = 160;
      radius = 16;
      bounty = 1;
    }

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      speed,
      hp,
      maxHp: hp,
      radius,
      angle: 0,
      attackCooldown: 1.2,
      attackTimer: 0,
      windupTimer: 0,
      isAttacking: false,
      walkCycle: Math.random() * 10,
      bountyValue: bounty,
      lineThickness: type === 'boss' ? 3.5 : 2.0,
      shootTimer: type === 'rider' ? 2.0 : undefined,
    });
  }

  // --- Simulation Update Loop ---

  public update(dt: number) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return; // Freeze-frame hitstop effect
    }

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update ambient decor
    this.updateDecor(dt);

    if (this.state !== 'playing') {
      // In title screen, let cowboy and horse show ambient animation
      this.player.walkCycle += dt * 3;
      this.player.horseGallopCycle += dt * 5;
      return;
    }

    this.stats.timeSurvived += dt;

    // Update Player
    this.updatePlayer(dt);

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Enemies
    this.updateEnemies(dt);

    // Update Particles
    this.updateParticles(dt);

    // Update Bounty pick-up magnet
    this.updateBounties(dt);

    // Update Waves
    this.updateWave(dt);

    // Update Camera smoothly
    const targetCamX = this.player.x - this.width / 2;
    const targetCamY = this.player.y - this.height / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
    this.cameraY += (targetCamY - this.cameraY) * 0.1;

    // Emit HUD stats
    this.callbacks.onStatsUpdate(this.stats, this.player);
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Aiming calculation towards mouse
    const worldMouseX = this.mouseX + this.cameraX;
    const worldMouseY = this.mouseY + this.cameraY;
    p.angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    // Input Movement
    let mx = 0;
    let my = 0;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    const isMoving = mx !== 0 || my !== 0;
    if (isMoving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      p.moveAngle = Math.atan2(my, mx);

      const targetVx = mx * p.speed;
      const targetVy = my * p.speed;
      p.vx += (targetVx - p.vx) * 0.22;
      p.vy += (targetVy - p.vy) * 0.22;

      p.walkCycle += dt * 10;
      p.horseGallopCycle += dt * 12;

      // Gallop sound if mounted
      if (p.isMounted) {
        this.gallopTimer += dt;
        if (this.gallopTimer > 0.24) {
          this.gallopTimer = 0;
          sound.playGallop(Math.sin(p.horseGallopCycle) > 0);
        }
      }
    } else {
      p.vx *= 0.8;
      p.vy *= 0.8;
    }

    // Move player
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Timers
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.dashTimer > 0) p.dashTimer -= dt;
    if (p.slashTimer > 0) p.slashTimer -= dt;
    if (p.gunTimer > 0) p.gunTimer -= dt;
    if (p.dynamiteTimer > 0) p.dynamiteTimer -= dt;

    // Dash state finish
    if (p.isDashing && p.invulnerableTimer <= 0) {
      p.isDashing = false;
    }

    // Slash animation progress
    if (p.isSlashing) {
      p.slashProgress += dt * 6.5;
      if (p.slashProgress >= 1.0) {
        p.isSlashing = false;
        p.slashProgress = 0;
      }
    }

    // Gun Reload
    if (p.gunReloadTimer > 0) {
      p.gunReloadTimer -= dt;
      if (p.gunReloadTimer <= 0) {
        p.gunAmmo = p.maxGunAmmo;
        sound.playRicochet();
        this.addFloatingText(p.x, p.y - 30, 'RELOADED!', '#d97706');
      }
    }

    // Horse Trample Contact Damage
    if (p.isMounted && isMoving) {
      this.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist < p.radius + enemy.radius + 10) {
          const trampleDamage = 15;
          const trampleDirX = Math.cos(p.moveAngle) * 220;
          const trampleDirY = Math.sin(p.moveAngle) * 220;
          this.damageEnemy(enemy, trampleDamage, false, trampleDirX, trampleDirY);
          this.addScreenShake(4);
        }
      });
    }

    // Auto-fire if mouse held down
    if (this.isMouseDown) {
      this.performPrimaryAttack();
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Ricochet off screen bounds or world borders
      if (p.bouncesLeft > 0) {
        let bounced = false;
        const screenMargin = 100;
        const left = this.cameraX - screenMargin;
        const right = this.cameraX + this.width + screenMargin;
        const top = this.cameraY - screenMargin;
        const bottom = this.cameraY + this.height + screenMargin;

        if (p.x <= left || p.x >= right) {
          p.vx = -p.vx;
          bounced = true;
        }
        if (p.y <= top || p.y >= bottom) {
          p.vy = -p.vy;
          bounced = true;
        }

        if (bounced) {
          p.bouncesLeft--;
          sound.playRicochet();
          this.createLineSplinters(p.x, p.y, 4);
        }
      }

      // Check collision with enemies (if player projectile)
      if (p.isPlayer && !p.isDynamite) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);

          if (dist <= p.radius + enemy.radius) {
            this.stats.shotsHit++;
            const isCrit = Math.random() < this.player.criticalChance;
            const dmg = isCrit ? p.damage * 2 : p.damage;
            this.damageEnemy(enemy, dmg, isCrit, p.vx * 0.15, p.vy * 0.15);

            p.pierce--;
            if (p.pierce <= 0) {
              p.life = 0;
              break;
            }
          }
        }
      } else if (!p.isPlayer) {
        // Enemy bullet hitting player
        const distToPlayer = Math.hypot(this.player.x - p.x, this.player.y - p.y);
        if (distToPlayer <= p.radius + this.player.radius) {
          this.damagePlayer(p.damage);
          p.life = 0;
        }
      }

      // Dynamite detonation
      if (p.isDynamite && p.life <= 0) {
        this.detonateDynamite(p.x, p.y);
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private detonateDynamite(x: number, y: number) {
    sound.playExplosion();
    this.addScreenShake(20);
    this.createShockwave(x, y, 60);
    this.createLineSplinters(x, y, 24, '#dc2626');

    const blastRadius = 140;
    this.enemies.forEach((enemy) => {
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist <= blastRadius) {
        const falloff = 1 - dist / blastRadius;
        const dmg = Math.round(80 * falloff);
        const kbX = ((enemy.x - x) / (dist || 1)) * 350;
        const kbY = ((enemy.y - y) / (dist || 1)) * 350;
        this.damageEnemy(enemy, dmg, true, kbX, kbY);
      }
    });
  }

  private updateEnemies(dt: number) {
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy);
      e.angle = Math.atan2(dy, dx);

      // AI movement & windup behaviors
      if (e.type === 'vulture') {
        // Swoop in arcs
        const swoopAngle = e.angle + Math.sin(this.stats.timeSurvived * 4 + e.id) * 0.8;
        e.vx = Math.cos(swoopAngle) * e.speed;
        e.vy = Math.sin(swoopAngle) * e.speed;
      } else if (e.type === 'snake') {
        // Slither directly towards player
        e.vx = Math.cos(e.angle) * e.speed;
        e.vy = Math.sin(e.angle) * e.speed;
      } else if (e.type === 'rider') {
        // Flank and circle player while shooting
        const orbitDist = 220;
        const orbitAngle = e.angle + (dist < orbitDist ? 1.4 : 0.2);
        e.vx = Math.cos(orbitAngle) * e.speed;
        e.vy = Math.sin(orbitAngle) * e.speed;

        // Rider shooting
        if (e.shootTimer !== undefined) {
          e.shootTimer -= dt;
          if (e.shootTimer <= 0) {
            e.shootTimer = 2.4;
            this.projectiles.push({
              id: this.nextProjId++,
              x: e.x,
              y: e.y,
              vx: Math.cos(e.angle) * 380,
              vy: Math.sin(e.angle) * 380,
              radius: 4,
              length: 12,
              damage: 1,
              isPlayer: false,
              bouncesLeft: 0,
              life: 2.0,
              maxLife: 2.0,
              pierce: 1,
            });
            sound.playGunshot();
          }
        }
      } else {
        // Standard walk towards player
        e.vx = (dx / (dist || 1)) * e.speed;
        e.vy = (dy / (dist || 1)) * e.speed;
      }

      // Move enemy
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.walkCycle += dt * 8;

      // Contact attack with player
      if (dist <= e.radius + this.player.radius) {
        if (e.attackTimer <= 0) {
          e.attackTimer = e.attackCooldown;
          const damage = e.type === 'boss' ? 2 : 1;
          this.damagePlayer(damage);
        }
      }

      if (e.attackTimer > 0) e.attackTimer -= dt;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      p.life -= dt;

      if (p.type === 'text') {
        p.vy -= 15 * dt; // float upwards
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateBounties(dt: number) {
    const p = this.player;
    for (let i = this.bounties.length - 1; i >= 0; i--) {
      const b = this.bounties[i];
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      const dist = Math.hypot(dx, dy);

      // Vacuum magnet range
      if (dist <= p.magnetRange) {
        const pullSpeed = 480;
        b.vx += ((dx / dist) * pullSpeed - b.vx) * 0.2;
        b.vy += ((dy / dist) * pullSpeed - b.vy) * 0.2;
      } else {
        b.vx *= 0.9;
        b.vy *= 0.9;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Collection
      if (dist <= p.radius + 14) {
        this.stats.bounty += b.value;
        this.stats.score += b.value * 50;
        sound.playBountyPickup(b.value);
        this.addFloatingText(b.x, b.y - 15, `+$${b.value}`, '#d97706');
        this.bounties.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        this.bounties.splice(i, 1);
      }
    }
  }

  private updateDecor(dt: number) {
    // Birds
    this.birds.forEach((b) => {
      b.x += b.vx * dt;
      b.wingAngle += b.flapSpeed * dt;
    });

    // Tumbleweeds
    this.tumbleweeds.forEach((tw) => {
      tw.x += tw.vx * dt;
      tw.y += tw.vy * dt;
      tw.angle += tw.rotSpeed * dt;

      // Wrap around world
      if (tw.x - this.cameraX > this.width + 300) {
        tw.x = this.cameraX - 200;
        tw.y = this.cameraY + Math.random() * this.height;
      }
    });
  }

  // --- Visual FX Helpers ---

  public addScreenShake(amount: number) {
    this.screenShake = Math.min(25, this.screenShake + amount);
  }

  public triggerHitStop(duration: number) {
    this.hitStopTimer = duration;
  }

  public addFloatingText(x: number, y: number, text: string, color?: string) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: -40,
      length: 0,
      angle: 0,
      vAngle: 0,
      lineWidth: 0,
      life: 0.85,
      maxLife: 0.85,
      type: 'text',
      text,
      color,
    });
  }

  public createLineSplinters(x: number, y: number, count: number, color?: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 8 + Math.random() * 12,
        angle: Math.random() * Math.PI,
        vAngle: (Math.random() - 0.5) * 12,
        lineWidth: 1.8,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75,
        type: 'line',
        color,
      });
    }
  }

  public createShockwave(x: number, y: number, radius: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      length: radius,
      angle: 0,
      vAngle: 0,
      lineWidth: 2,
      life: 0.3,
      maxLife: 0.3,
      type: 'smoke',
    });
  }

  // --- Render Loop ---

  public render() {
    const ctx = this.ctx;

    // Apply Screen Shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() * 2 - 1) * this.screenShake;
      const shakeY = (Math.random() * 2 - 1) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Desert Horizon, Red Sun Rays, Birds, Tumbleweeds
    this.renderer.drawBackground(
      this.width,
      this.height,
      this.cameraX,
      this.cameraY,
      this.birds,
      this.tumbleweeds,
      this.stats.timeSurvived
    );

    // 2. Bounties (dropped ink coins)
    this.bounties.forEach((b) => this.renderer.drawBounty(b, this.cameraX, this.cameraY));

    // 3. Projectiles (Bullets, Razor Waves, Dynamite)
    this.projectiles.forEach((p) => this.renderer.drawProjectile(p, this.cameraX, this.cameraY));

    // 4. Enemies
    this.enemies.forEach((e) => this.renderer.drawEnemy(e, this.cameraX, this.cameraY));

    // 5. Main Character (Cowboy on foot or Mounted on Rearing Horse)
    this.renderer.drawPlayer(this.player, this.cameraX, this.cameraY);

    // 6. Particles & Splinter lines & Floating texts
    this.particles.forEach((p) => this.renderer.drawParticle(p, this.cameraX, this.cameraY));

    ctx.restore();
  }
}

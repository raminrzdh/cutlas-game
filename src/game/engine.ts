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
  Platform,
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
  public platforms: Platform[] = [];

  // 2D Western Gravity & Platforming Physics
  public readonly groundY: number = 160;
  public readonly gravity: number = 1100;
  public readonly jumpForce: number = 530;
  public readonly horseJumpForce: number = 700;

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
    chivalryActs: 0,
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
    this.initPlatforms();
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

  private initPlatforms() {
    this.platforms = [
      { id: 1, x: -340, y: 55, width: 220, height: 16, type: 'roof', label: 'SALOON' },
      { id: 2, x: -750, y: -10, width: 180, height: 16, type: 'wood', label: 'JAIL TOWER' },
      { id: 3, x: 220, y: 65, width: 200, height: 16, type: 'wood', label: 'WATER TANK' },
      { id: 4, x: 650, y: 20, width: 220, height: 16, type: 'wood', label: 'TELEGRAPH' },
      { id: 5, x: 1100, y: 50, width: 260, height: 22, type: 'rock', label: 'RED MESA' },
      { id: 6, x: -1250, y: 35, width: 240, height: 16, type: 'wood', label: 'MINE #37' },
      { id: 7, x: 1600, y: -20, width: 200, height: 16, type: 'wood', label: 'WINDMILL' },
      { id: 8, x: -1800, y: 60, width: 240, height: 20, type: 'rock', label: 'CANYON LEDGE' },
    ];
  }

  public resetPlayer() {
    this.player = {
      x: 0,
      y: this.groundY,
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
      isGrounded: true,

      weapon: 'revolver',
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
      quickDrawTimer: 0,
      isThinking: false,

      // Loyal White Dog Companion from the animated series
      dog: {
        x: -32,
        y: this.groundY + 10,
        vx: 0,
        vy: 0,
        angle: 0,
        walkCycle: 0,
        tailWag: 0,
        state: 'follow',
        targetBountyId: null,
        targetEnemyId: null,
        level: 1,
        fetchSpeed: 290,
        biteDamage: 18,
        barkCooldown: 3.0,
        barkTimer: 0,
        biteCooldown: 1.0,
        biteTimer: 0,
        chivalryAura: true,
        carryingBountyValue: 0,
      },

      lineThickness: 2.2,
      ricochetCount: 0,
      razorWave: false,
      dynamiteUnlocked: false,
      dynamiteCooldown: 5.0,
      dynamiteTimer: 0,
      magnetRange: 140,
      criticalChance: 0.05,
      chivalryKindness: 0,
      walkCycle: 0,
      horseGallopCycle: 0,
      facingDir: 1,
      currentYaw: 0,
      timeSec: 0,
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
      chivalryActs: 0,
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

      // Switch Weapon (1 = Cutlas, 2 = Revolver, Q = Quick Toggle)
      if (e.key === '1') {
        this.player.weapon = this.player.razorWave ? 'razor_wave' : 'cutlas';
        sound.playSlash(1.2);
        this.addFloatingText(this.player.x, this.player.y - 30, 'CUTLAS EQUIPPED', '#111827');
      } else if (e.key === '2') {
        this.player.weapon = 'revolver';
        sound.playRicochet();
        this.addFloatingText(this.player.x, this.player.y - 30, 'REVOLVER EQUIPPED', '#111827');
      } else if (e.key === 'q' || e.key === 'Q') {
        if (this.player.weapon === 'revolver') {
          this.player.weapon = this.player.razorWave ? 'razor_wave' : 'cutlas';
          sound.playSlash(1.2);
          this.addFloatingText(this.player.x, this.player.y - 30, 'CUTLAS EQUIPPED', '#111827');
        } else {
          this.player.weapon = 'revolver';
          sound.playRicochet();
          this.addFloatingText(this.player.x, this.player.y - 30, 'REVOLVER EQUIPPED', '#111827');
        }
      }

      // Jump with Gravity (W, Up Arrow, or Space)
      if ((e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.code === 'Space') && this.state === 'playing') {
        this.performJump();
      }

      // Toggle Horse Mount (E or H when horse unlocked)
      if ((e.key === 'e' || e.key === 'E' || e.key === 'h' || e.key === 'H') && this.state === 'playing') {
        if (this.player.horseUnlocked) {
          this.toggleHorseMount();
        }
      }

      // Toggle Thinking / Philosopher Pose (T)
      if ((e.key === 't' || e.key === 'T') && this.state === 'playing') {
        this.player.isThinking = !this.player.isThinking;
        if (this.player.isThinking) {
          this.addFloatingText(this.player.x, this.player.y - 40, '...', '#111827');
        }
      }

      // Throw Dynamite (F or G)
      if ((e.key === 'f' || e.key === 'F' || e.key === 'g' || e.key === 'G') && this.player.dynamiteUnlocked && this.state === 'playing') {
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

  public performJump() {
    const p = this.player;
    if (p.isGrounded) {
      p.vy = p.isMounted ? -this.horseJumpForce : -this.jumpForce;
      p.isGrounded = false;
      p.isThinking = false;
      sound.playJump();
      this.createLineSplinters(p.x, p.y + 45, 6, '#78716c');
      this.addScreenShake(2);
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
    this.player.quickDrawTimer = 0.28; // Hip holster draw animation
    this.stats.shotsFired++;
    sound.playGunshot();
    this.addScreenShake(3);

    const angle = this.player.angle + (Math.random() - 0.5) * 0.05;
    const speed = 760;

    this.projectiles.push({
      id: this.nextProjId++,
      x: this.player.x + Math.cos(angle) * 26,
      y: this.player.y + Math.sin(angle) * 26,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4,
      length: 16,
      damage: this.player.gunDamage,
      isPlayer: true,
      bouncesLeft: this.player.ricochetCount,
      life: 1.5,
      maxLife: 1.5,
      pierce: 1,
    });

    // Comic BANG! starburst burst at gun tip
    this.particles.push({
      x: this.player.x + Math.cos(angle) * 36,
      y: this.player.y + Math.sin(angle) * 36,
      vx: Math.cos(angle) * 15,
      vy: Math.sin(angle) * 15,
      length: 16,
      angle: 0,
      vAngle: 0,
      lineWidth: 2,
      life: 0.28,
      maxLife: 0.28,
      type: 'bang',
    });

    // Muzzle smoke particle
    this.particles.push({
      x: this.player.x + Math.cos(angle) * 30,
      y: this.player.y + Math.sin(angle) * 30,
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

    // Determine spawn location in 2D gravity world:
    // Ground enemies spawn on left or right on the desert ground
    // Vultures spawn high in the open sky
    const side = Math.random() < 0.5 ? -1 : 1;
    let x = this.player.x + side * (this.width * 0.55 + 80 + Math.random() * 220);
    let y = this.groundY;
    if (type === 'vulture') {
      x = this.player.x + (Math.random() - 0.5) * (this.width + 300);
      y = this.player.y - 220 - Math.random() * 160;
    }

    let hp = 40 + wave * 8;
    let speed = 120 + Math.random() * 40;
    let radius = 18;
    let bounty = 1 + Math.floor(wave / 2);
    let characterIdentity: Enemy['characterIdentity'] = undefined;

    if (type === 'boss') {
      const isJakBoss = wave % 10 === 5;
      if (isJakBoss) {
        characterIdentity = 'jak';
        hp = 380 + wave * 70;
        speed = 130;
        radius = 28;
        bounty = 30;
        this.addFloatingText(this.player.x, this.player.y - 70, 'NEMESIS: JAK THE BAD!', '#7e22ce');
      } else {
        hp = 450 + wave * 80;
        speed = 90;
        radius = 42;
        bounty = 25;
        this.addFloatingText(this.player.x, this.player.y - 70, 'OUTLAW BOSS: EL DIABLO!', '#dc2626');
      }
      sound.playHit(true);
    } else if (type === 'rider') {
      hp = 70 + wave * 10;
      speed = 210;
      radius = 24;
      bounty = 4;
      characterIdentity = 'bandit';
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
      // Chance for Alien 37 or Jim
      characterIdentity = Math.random() < 0.35 ? 'alien_37' : (Math.random() < 0.5 ? 'jim' : 'bandit');
    } else if (type === 'bandit') {
      // Chance for Juan Bala (the slow meditating sharpshooter)
      characterIdentity = Math.random() < 0.2 ? 'juan_bala' : 'bandit';
    }

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      characterIdentity,
      facingDir: 1,
      currentYaw: 0,
      timeSec: 0,
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
      shootTimer: type === 'rider' || characterIdentity === 'jak' || characterIdentity === 'juan_bala' ? 2.0 : undefined,
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

    // Update Kotlas's Loyal White Dog
    this.updateDog(dt);

    // Update Chivalry & Kindness Heart Aura
    this.updateChivalry(dt);

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

    // Update Camera smoothly (anchored so desert ground is in lower third)
    const targetCamX = this.player.x - this.width / 2;
    const targetCamY = this.player.y - this.height * 0.62;
    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.08;

    // Emit HUD stats
    this.callbacks.onStatsUpdate(this.stats, this.player);
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Aiming calculation towards mouse
    const worldMouseX = this.mouseX + this.cameraX;
    const worldMouseY = this.mouseY + this.cameraY;
    p.angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
    p.timeSec += dt;

    // 2D Horizontal Input Movement
    let mx = 0;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;
    const isDownPressed = this.keys['s'] || this.keys['arrowdown'];

    // Apply 2D Gravity
    p.vy += this.gravity * dt;
    if (isDownPressed && !p.isGrounded) {
      p.vy += 650 * dt; // fast-fall
    }
    p.vy = Math.min(850, p.vy); // Terminal fall velocity

    // 2D Facing Direction:
    // If shooting, quick-drawing, or aiming with mouse: face towards mouse crosshair.
    // If just running horizontally without active mouse targeting: face movement direction.
    const isCombatActive = p.gunTimer > 0 || p.quickDrawTimer > 0 || p.isSlashing;
    const aimFacingDir = Math.cos(p.angle) >= 0 ? 1 : -1;
    const moveFacingDir = mx !== 0 ? (mx > 0 ? 1 : -1) : aimFacingDir;
    const targetFacingDir = isCombatActive ? aimFacingDir : (mx !== 0 ? moveFacingDir : p.facingDir || 1);
    p.facingDir = targetFacingDir;
    const targetYaw = targetFacingDir === 1 ? 0 : Math.PI;
    p.currentYaw += (targetYaw - p.currentYaw) * Math.min(1, dt * 25);

    const isMovingHoriz = mx !== 0;
    if (isMovingHoriz) {
      p.isThinking = false;
      const targetSpeed = p.isMounted ? p.speed * 1.45 : p.speed;
      const targetVx = mx * targetSpeed;
      const accel = p.isGrounded ? 0.32 : 0.18;
      p.vx += (targetVx - p.vx) * accel;

      if (p.isGrounded) {
        p.walkCycle += dt * 11;
        p.horseGallopCycle += dt * 13;

        // Gallop sound if mounted
        if (p.isMounted) {
          this.gallopTimer += dt;
          if (this.gallopTimer > 0.24) {
            this.gallopTimer = 0;
            sound.playGallop(Math.sin(p.horseGallopCycle) > 0);
          }
        }
      }
    } else {
      const friction = p.isGrounded ? 0.76 : 0.94;
      p.vx *= friction;
    }

    // Move player with collision checks
    const prevY = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Check one-way platforms (only land if falling downwards and not holding Down)
    let onPlatform = false;
    if (p.vy >= 0 && !isDownPressed) {
      for (const plat of this.platforms) {
        if (p.x >= plat.x - 14 && p.x <= plat.x + plat.width + 14) {
          // Check if player landed on top of platform
          if (prevY <= plat.y && p.y >= plat.y) {
            if (p.vy > 280) {
              sound.playRicochet();
              this.createLineSplinters(p.x, plat.y + 45, 5, '#78716c');
            }
            p.y = plat.y;
            p.vy = 0;
            p.isGrounded = true;
            onPlatform = true;
            break;
          }
        }
      }
    }

    // Check world ground floor
    if (!onPlatform) {
      if (p.y >= this.groundY) {
        if (p.vy > 320) {
          this.createLineSplinters(p.x, this.groundY + 45, 7, '#78716c');
          this.addScreenShake(1.5);
        }
        p.y = this.groundY;
        p.vy = 0;
        p.isGrounded = true;
      } else {
        p.isGrounded = false;
      }
    }

    // Timers
    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.dashTimer > 0) p.dashTimer -= dt;
    if (p.slashTimer > 0) p.slashTimer -= dt;
    if (p.gunTimer > 0) p.gunTimer -= dt;
    if (p.dynamiteTimer > 0) p.dynamiteTimer -= dt;
    if (p.quickDrawTimer > 0) p.quickDrawTimer -= dt;

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

  /**
   * Update Kotlas's Loyal White Dog Companion AI
   * Follows, fetches bounty coins to deliver to Kotlas, barks at outlaws, bites if upgraded!
   */
  private updateDog(dt: number) {
    const p = this.player;
    const dog = p.dog;

    dog.tailWag += dt * 10;
    if (dog.barkTimer > 0) dog.barkTimer -= dt;
    if (dog.biteTimer > 0) dog.biteTimer -= dt;

    // 1. If carrying a bounty coin, run back to Kotlas!
    if (dog.carryingBountyValue > 0) {
      dog.state = 'fetch';
      const dx = p.x - dog.x;
      const dy = p.y - dog.y;
      const dist = Math.hypot(dx, dy);
      dog.angle = Math.atan2(dy, dx);

      if (dist > 30) {
        dog.vx = (dx / dist) * dog.fetchSpeed;
        dog.vy = (dy / dist) * dog.fetchSpeed;
        dog.x += dog.vx * dt;
        dog.y += dog.vy * dt;
        dog.walkCycle += dt * 14;
      } else {
        // Returned safely to Kotlas with the bounty!
        this.stats.bounty += dog.carryingBountyValue;
        this.stats.score += dog.carryingBountyValue * 60;
        this.stats.chivalryActs++;
        sound.playBountyPickup();
        sound.playDogBark();
        this.addFloatingText(dog.x, dog.y - 20, `GOOD BOY! +$${dog.carryingBountyValue}`, '#d97706');
        this.particles.push({
          x: dog.x,
          y: dog.y - 15,
          vx: 0,
          vy: -35,
          length: 0,
          angle: 0,
          vAngle: 0,
          lineWidth: 2,
          life: 0.8,
          maxLife: 0.8,
          type: 'heart',
          color: '#dc2626',
        });
        dog.carryingBountyValue = 0;
        dog.state = 'happy';
      }
      return;
    }

    // 2. Look for dropped bounty items within range to fetch
    let closestBounty: BountyItem | null = null;
    let minDist = 380;
    for (const b of this.bounties) {
      if (b.collected) continue;
      const d = Math.hypot(b.x - dog.x, b.y - dog.y);
      if (d < minDist) {
        minDist = d;
        closestBounty = b;
      }
    }

    if (closestBounty) {
      dog.state = 'fetch';
      const dx = closestBounty.x - dog.x;
      const dy = closestBounty.y - dog.y;
      const dist = Math.hypot(dx, dy);
      dog.angle = Math.atan2(dy, dx);

      if (dist > 16) {
        dog.vx = (dx / dist) * dog.fetchSpeed;
        dog.vy = (dy / dist) * dog.fetchSpeed;
        dog.x += dog.vx * dt;
        dog.y += dog.vy * dt;
        dog.walkCycle += dt * 14;
      } else {
        // Pick up bounty in mouth!
        dog.carryingBountyValue = closestBounty.value;
        closestBounty.collected = true;
        this.bounties = this.bounties.filter((item) => item.id !== closestBounty!.id);
        sound.playDogBark();
      }
      return;
    }

    // 3. Check for nearby bandits: dog defends Kotlas
    let closestEnemy: Enemy | null = null;
    let enemyDist = 95;
    for (const enemy of this.enemies) {
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (d < enemyDist) {
        enemyDist = d;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      dog.state = 'attack';
      const dx = closestEnemy.x - dog.x;
      const dy = closestEnemy.y - dog.y;
      const dist = Math.hypot(dx, dy);
      dog.angle = Math.atan2(dy, dx);

      // Bark to stun
      if (dog.barkTimer <= 0) {
        dog.barkTimer = dog.barkCooldown;
        sound.playDogBark();
        closestEnemy.vx -= Math.cos(dog.angle) * 160;
        closestEnemy.vy -= Math.sin(dog.angle) * 160;
        this.addFloatingText(dog.x, dog.y - 15, 'WOOF!', '#dc2626');
      }

      // Bite if upgraded
      if (dog.level >= 2 && dist < 32 && dog.biteTimer <= 0) {
        dog.biteTimer = dog.biteCooldown;
        this.damageEnemy(closestEnemy, dog.biteDamage, false);
        sound.playHit(false);
      }

      // Move protectively near Kotlas and enemy
      const guardX = p.x + (closestEnemy.x - p.x) * 0.45;
      const gDx = guardX - dog.x;
      dog.vx = Math.sign(gDx) * dog.fetchSpeed * 0.6;
      dog.vy += this.gravity * dt;
      dog.vy = Math.min(850, dog.vy);
      dog.x += dog.vx * dt;
      dog.y += dog.vy * dt;
      dog.walkCycle += dt * 10;

      if (dog.y >= this.groundY + 10) {
        dog.y = this.groundY + 10;
        dog.vy = 0;
      }
      return;
    }

    // 4. Default follow Kotlas loyally with 2D gravity
    dog.state = 'follow';
    const followOffsetX = -36 * (p.facingDir || 1);
    const targetX = p.x + followOffsetX;
    const fDx = targetX - dog.x;
    const fDist = Math.abs(fDx);

    if (fDist > 16) {
      dog.angle = fDx >= 0 ? 0 : Math.PI;
      const followSpeed = Math.min(p.speed * 1.35, Math.max(140, fDist * 5));
      dog.vx = Math.sign(fDx) * followSpeed;
      dog.walkCycle += dt * 11;
    } else {
      dog.vx *= 0.78;
    }

    // Dog Gravity
    dog.vy += this.gravity * dt;
    dog.vy = Math.min(850, dog.vy);

    // If player jumped up to a platform or higher ground, dog leaps up!
    if (p.y < dog.y - 25 && dog.vy === 0 && Math.random() < 0.05) {
      dog.vy = -530;
      sound.playDogBark();
    }

    dog.x += dog.vx * dt;
    dog.y += dog.vy * dt;

    // Platform landing check for dog
    let dogOnPlat = false;
    if (dog.vy >= 0) {
      for (const plat of this.platforms) {
        if (dog.x >= plat.x - 12 && dog.x <= plat.x + plat.width + 12) {
          if (dog.y >= plat.y + 10 && dog.y - dog.vy * dt <= plat.y + 20) {
            dog.y = plat.y + 10;
            dog.vy = 0;
            dogOnPlat = true;
            break;
          }
        }
      }
    }
    if (!dogOnPlat) {
      if (dog.y >= this.groundY + 10) {
        dog.y = this.groundY + 10;
        dog.vy = 0;
      }
    }
  }

  /** Chivalry and kindness aura pulse */
  private chivalryTimer: number = 0;
  private updateChivalry(dt: number) {
    this.chivalryTimer += dt;
    const interval = this.player.chivalryKindness > 0 ? 5.5 : 9.0;
    if (this.chivalryTimer >= interval) {
      this.chivalryTimer = 0;
      this.triggerChivalryPulse();
    }
  }

  private triggerChivalryPulse() {
    sound.playKindnessHeart();
    this.particles.push({
      x: this.player.x + (Math.random() - 0.5) * 20,
      y: this.player.y - 35,
      vx: (Math.random() - 0.5) * 15,
      vy: -35,
      length: 0,
      angle: 0,
      vAngle: 0,
      lineWidth: 2,
      life: 1.0,
      maxLife: 1.0,
      type: 'heart',
      color: '#dc2626',
    });

    if (this.player.chivalryKindness > 0) {
      if (this.player.hp < this.player.maxHp) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this.addFloatingText(this.player.x, this.player.y - 40, '+1 HP ♥', '#dc2626');
      }
      this.stats.chivalryActs++;
      // Calm/slow nearest enemies
      this.enemies.forEach((e) => {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < 180) {
          e.vx *= 0.4;
          e.vy *= 0.4;
          this.addFloatingText(e.x, e.y - 20, '♥', '#dc2626');
        }
      });
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

      // AI movement & windup behaviors with 2D gravity
      if (e.type === 'vulture') {
        // Swoop in arcs through the desert sky
        const swoopAngle = e.angle + Math.sin(this.stats.timeSurvived * 4 + e.id) * 0.8;
        e.vx = Math.cos(swoopAngle) * e.speed;
        e.vy = Math.sin(swoopAngle) * e.speed;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.type === 'snake') {
        // Slither along ground
        e.vx = Math.sign(dx) * e.speed;
        e.x += e.vx * dt;
        e.y = this.groundY + 16;
      } else if (e.type === 'rider') {
        // Mounted outlaw on horseback
        const orbitDist = 240;
        const dirX = Math.sign(dx);
        if (Math.abs(dx) > orbitDist) {
          e.vx = dirX * e.speed;
        } else {
          e.vx = -dirX * e.speed * 0.4;
        }
        e.vy += this.gravity * dt;
        e.vy = Math.min(850, e.vy);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.y >= this.groundY) {
          e.y = this.groundY;
          e.vy = 0;
        }

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
        // Ground bandits, brutes, scouts, boss
        e.vx = Math.sign(dx) * e.speed;
        e.vy += this.gravity * dt;
        e.vy = Math.min(850, e.vy);

        // Jump if player is higher on a platform
        if (this.player.y < e.y - 25 && Math.abs(dx) < 220 && Math.random() < 0.025 && e.vy === 0) {
          e.vy = -490;
        }

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // Platform landing
        let onPlat = false;
        if (e.vy >= 0) {
          for (const plat of this.platforms) {
            if (e.x >= plat.x - 12 && e.x <= plat.x + plat.width + 12) {
              if (e.y >= plat.y && e.y - e.vy * dt <= plat.y + 16) {
                e.y = plat.y;
                e.vy = 0;
                onPlat = true;
                break;
              }
            }
          }
        }
        if (!onPlat) {
          if (e.y >= this.groundY) {
            e.y = this.groundY;
            e.vy = 0;
          }
        }
      }
      e.walkCycle += dt * 8;
      e.timeSec += dt;

      // 3D Yaw turning interpolation over 4 frames for natural limb crossing
      const targetFacingDir = Math.cos(e.angle) >= 0 ? 1 : -1;
      e.facingDir = targetFacingDir;
      const targetYaw = targetFacingDir === 1 ? 0 : Math.PI;
      e.currentYaw += (targetYaw - e.currentYaw) * Math.min(1, dt * 25);

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

    // 1b. Platforms (Saloon rooftops, watchtowers, water tanks, sandstone mesa rocks)
    this.renderer.drawPlatforms(this.platforms, this.cameraX, this.cameraY);

    // 2. Bounties (dropped ink coins)
    this.bounties.forEach((b) => this.renderer.drawBounty(b, this.cameraX, this.cameraY));

    // 3. Projectiles (Bullets, Razor Waves, Dynamite)
    this.projectiles.forEach((p) => this.renderer.drawProjectile(p, this.cameraX, this.cameraY));

    // 4. Enemies
    this.enemies.forEach((e) => this.renderer.drawEnemy(e, this.cameraX, this.cameraY));

    // 5. Main Character Kotlas (White stick character with black outline)
    this.renderer.drawPlayer(this.player, this.cameraX, this.cameraY);

    // 5b. Loyal White Dog Companion (Kotlas's companion)
    this.renderer.drawWhiteDog(this.player.dog, this.cameraX, this.cameraY);

    // 6. Particles & Splinter lines & Floating texts
    this.particles.forEach((p) => this.renderer.drawParticle(p, this.cameraX, this.cameraY));

    ctx.restore();
  }
}

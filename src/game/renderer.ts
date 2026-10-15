import {
  Player,
  Enemy,
  Projectile,
  Particle,
  BountyItem,
  Tumbleweed,
  CloudBird,
  VisualTheme,
} from '../types/game';

export interface ThemeColors {
  bg: string;
  ink: string;
  inkSubtle: string;
  accentRed: string;
  accentGold: string;
  ground: string;
  gridLine: string;
}

export const THEMES: Record<VisualTheme, ThemeColors> = {
  ink: {
    bg: '#f7f4ed',
    ink: '#18181b',
    inkSubtle: '#71717a',
    accentRed: '#dc2626',
    accentGold: '#d97706',
    ground: '#e5dec9',
    gridLine: 'rgba(24, 24, 27, 0.05)',
  },
  midnight: {
    bg: '#0c0f12',
    ink: '#f8fafc',
    inkSubtle: '#64748b',
    accentRed: '#f43f5e',
    accentGold: '#fbbf24',
    ground: '#1e293b',
    gridLine: 'rgba(248, 250, 252, 0.05)',
  },
  sepia: {
    bg: '#ede0cb',
    ink: '#2d1e15',
    inkSubtle: '#7d6756',
    accentRed: '#b91c1c',
    accentGold: '#9a6a16',
    ground: '#dbc6aa',
    gridLine: 'rgba(45, 30, 21, 0.05)',
  },
};

export class LineRenderer {
  private ctx: CanvasRenderingContext2D;
  public theme: VisualTheme = 'ink';

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public getColors(): ThemeColors {
    return THEMES[this.theme];
  }

  /** Clear canvas and draw minimalist desert horizon, sun & line grid */
  public drawBackground(
    width: number,
    height: number,
    cameraX: number,
    cameraY: number,
    birds: CloudBird[],
    tumbleweeds: Tumbleweed[],
    sunTime: number
  ) {
    const ctx = this.ctx;
    const colors = this.getColors();

    // Fill canvas background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle paper grid lines (sketchbook feeling)
    ctx.save();
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;
    const gridSize = 64;
    const offsetX = -cameraX % gridSize;
    const offsetY = -cameraY % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw Iconic Desert Sun and Radiating Red Rays (Directly inspired by attached Image 2)
    ctx.save();
    const sunScreenX = width * 0.15 + (cameraX * -0.05);
    const sunScreenY = height * 0.22 + (cameraY * -0.05);
    const sunRadius = 26;

    // Sun ring circle
    ctx.strokeStyle = colors.accentRed;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(sunScreenX, sunScreenY, sunRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Radiating bold rays (10 expressive rays around the top, just like image 2)
    const rayCount = 10;
    const rayDist = 42;
    const rayLength = 22;
    for (let i = 0; i < rayCount; i++) {
      const angle = -Math.PI * 0.9 + (i / (rayCount - 1)) * (Math.PI * 0.95) + Math.sin(sunTime * 0.001) * 0.03;
      const x1 = sunScreenX + Math.cos(angle) * rayDist;
      const y1 = sunScreenY + Math.sin(angle) * rayDist;
      const x2 = sunScreenX + Math.cos(angle) * (rayDist + rayLength + (i % 2 === 0 ? 6 : 0));
      const y2 = sunScreenY + Math.sin(angle) * (rayDist + rayLength + (i % 2 === 0 ? 6 : 0));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    // Draw Rolling Desert Horizon Curve (Inspired by Image 2 curved ground hill)
    ctx.save();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 3;
    const horizonBaseY = height * 0.78 + (cameraY * -0.1);
    ctx.beginPath();
    ctx.moveTo(0, horizonBaseY + Math.sin((cameraX * 0.002)) * 30);
    for (let x = 0; x <= width; x += 40) {
      const worldX = x + cameraX * 0.1;
      const hillY = horizonBaseY + Math.sin(worldX * 0.002) * 35 + Math.cos(worldX * 0.005) * 15;
      ctx.lineTo(x, hillY);
    }
    ctx.stroke();

    // Distant Cacti line silhouettes along horizon
    const cactiPositions = [120, 480, 850, 1300, 1750];
    cactiPositions.forEach((cx) => {
      const screenCx = (cx - (cameraX * 0.15)) % (width + 300) - 100;
      const cy = horizonBaseY + Math.sin((cx) * 0.002) * 35 - 10;
      this.drawDistantCactus(screenCx, cy, 0.7);
    });

    ctx.restore();

    // Background birds (from Image 2: "~", "^", "m" shaped stick birds)
    ctx.save();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    birds.forEach((b) => {
      const bx = (b.x - cameraX * 0.2) % (width + 200);
      const by = b.y - cameraY * 0.2;
      const flap = Math.sin(b.wingAngle) * 6;
      ctx.beginPath();
      ctx.moveTo(bx - 12 * b.scale, by + flap);
      ctx.quadraticCurveTo(bx - 6 * b.scale, by - flap, bx, by);
      ctx.quadraticCurveTo(bx + 6 * b.scale, by - flap, bx + 12 * b.scale, by + flap);
      ctx.stroke();
    });
    ctx.restore();

    // Rolling Tumbleweeds
    ctx.save();
    ctx.strokeStyle = colors.inkSubtle;
    ctx.lineWidth = 1.6;
    tumbleweeds.forEach((tw) => {
      const tx = tw.x - cameraX;
      const ty = tw.y - cameraY;
      if (tx > -50 && tx < width + 50 && ty > -50 && ty < height + 50) {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(tw.angle);
        // Scratchy line circle
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, tw.radius, tw.radius * 0.75, (i * Math.PI) / 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    });
    ctx.restore();
  }

  private drawDistantCactus(x: number, y: number, scale: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    // Central stem
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 50 * scale);
    // Left arm
    ctx.moveTo(x, y - 28 * scale);
    ctx.lineTo(x - 16 * scale, y - 28 * scale);
    ctx.lineTo(x - 16 * scale, y - 44 * scale);
    // Right arm
    ctx.moveTo(x, y - 36 * scale);
    ctx.lineTo(x + 16 * scale, y - 36 * scale);
    ctx.lineTo(x + 16 * scale, y - 54 * scale);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw the iconic attached Cowboy Main Character (From Image 1 & 2)
   * Exact components:
   * - Flat brim hat with crown
   * - Oval head
   * - Elongated vertical oval torso
   * - Stick legs with L-shaped feet
   * - Stick arms with 3-finger splayed hands
   * - Holster shape on hip
   * - Cutlass or Revolver
   */
  public drawPlayer(player: Player, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const colors = this.getColors();
    const px = player.x - cameraX;
    const py = player.y - cameraY;

    ctx.save();
    ctx.translate(px, py);

    // Flashing when invulnerable
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Ghost dash afterimages
    if (player.isDashing) {
      ctx.strokeStyle = colors.accentRed;
      ctx.lineWidth = player.lineThickness + 1;
    } else {
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = player.lineThickness;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (player.isMounted) {
      // ----------------------------------------------------
      // DRAW MOUNTED COWBOY ON HORSE (Matches attached Image 2!)
      // ----------------------------------------------------
      this.drawRearingHorseAndRider(player, colors);
    } else {
      // ----------------------------------------------------
      // DRAW ON-FOOT COWBOY (Matches attached Image 1!)
      // ----------------------------------------------------
      this.drawOnFootCowboy(player, colors);
    }

    ctx.restore();
  }

  /** Matches attached Image 1 exactly */
  private drawOnFootCowboy(player: Player, colors: ThemeColors) {
    const ctx = this.ctx;
    const aimAngle = player.angle;
    const walk = Math.sin(player.walkCycle);
    const walkCos = Math.cos(player.walkCycle);
    const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;

    // Center of player is at (0, 0)
    // Head: oval at (0, -28)
    // Hat: brim at (0, -36) and dome crown above
    // Torso: elongated oval from (0, -18) to (0, 14)
    // Legs: from (0, 14) down to feet at y = 46

    // 1. LEGS & FEET (Stick lines with L-foot)
    const legSwing = isMoving ? walk * 14 : 0;
    const leftFootX = -12 + legSwing;
    const leftFootY = 46 - Math.abs(walkCos) * 4;
    const rightFootX = 12 - legSwing;
    const rightFootY = 46 - Math.abs(walk) * 4;

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-4, 14);
    ctx.lineTo(leftFootX, leftFootY);
    ctx.lineTo(leftFootX - 10, leftFootY); // L-shaped foot
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(4, 14);
    ctx.lineTo(rightFootX, rightFootY);
    ctx.lineTo(rightFootX + 10, rightFootY); // L-shaped foot
    ctx.stroke();

    // 2. HOLSTER ON HIP (Iconic angled holster from Image 1)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-7, 4);
    ctx.lineTo(-14, 4);
    ctx.lineTo(-14, 16);
    ctx.lineTo(-9, 16);
    ctx.lineTo(-9, 8);
    ctx.stroke();
    ctx.restore();

    // 3. ELONGATED OVAL TORSO (From Image 1)
    ctx.beginPath();
    // Center at (0, -2), radiusX: 7, radiusY: 18
    ctx.ellipse(0, -2, 7.5, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4. OVAL HEAD & HAT (From Image 1)
    // Oval head at (0, -28)
    ctx.beginPath();
    ctx.ellipse(0, -28, 5.5, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Hat: Brim line at y = -36, width 32
    ctx.beginPath();
    ctx.moveTo(-16, -36);
    ctx.lineTo(16, -36);
    ctx.stroke();

    // Hat Crown: dome on top of brim
    ctx.beginPath();
    ctx.arc(0, -36, 7.5, Math.PI, 0, false);
    ctx.stroke();

    // 5. ARMS & 3-FINGER SPLAYED HANDS (From Image 1)
    // Left arm (free arm with 3-finger splay)
    const leftArmAngle = Math.PI * 0.7 + (isMoving ? -walk * 0.4 : 0);
    const leftHandX = Math.cos(leftArmAngle) * 26;
    const leftHandY = -14 + Math.sin(leftArmAngle) * 26;

    ctx.beginPath();
    ctx.moveTo(-7, -14);
    ctx.lineTo(leftHandX, leftHandY);
    // 3-fingers / claw hands from Image 1:
    this.drawThreeFingerHand(leftHandX, leftHandY, leftArmAngle);
    ctx.stroke();

    // Right arm (Weapon Arm - aiming toward aimAngle)
    const shoulderX = 7;
    const shoulderY = -14;
    const armLen = 22;
    const weaponHandX = shoulderX + Math.cos(aimAngle) * armLen;
    const weaponHandY = shoulderY + Math.sin(aimAngle) * armLen;

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(weaponHandX, weaponHandY);
    ctx.stroke();

    // 6. DRAW WEAPON (Cutlas or Revolver)
    if (player.weapon === 'cutlas' || player.weapon === 'dual_cutlas' || player.weapon === 'razor_wave') {
      this.drawCutlas(weaponHandX, weaponHandY, aimAngle, player);
      if (player.weapon === 'dual_cutlas') {
        // Draw second cutlas in left hand
        this.drawCutlas(leftHandX, leftHandY, leftArmAngle - 0.5, player, true);
      }
    } else {
      this.drawRevolver(weaponHandX, weaponHandY, aimAngle, player);
    }

    // 7. SWORD SLASH ANIMATION (Dynamic line trail arc)
    if (player.isSlashing) {
      this.drawSlashArc(player, aimAngle, colors);
    }
  }

  /** Matches attached Image 2: Rearing Horse with Cowboy Rider mounted on top */
  private drawRearingHorseAndRider(player: Player, colors: ThemeColors) {
    const ctx = this.ctx;
    const aimAngle = player.angle;
    const gallop = Math.sin(player.horseGallopCycle);
    const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;

    // Rearing tilt angle when galloping
    const rearAngle = isMoving ? -0.25 + gallop * 0.12 : -0.35;
    ctx.save();
    ctx.rotate(rearAngle);

    // --- HORSE (From Image 2) ---
    // Elongated oval horse torso
    ctx.beginPath();
    ctx.ellipse(0, 10, 24, 11, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Long Neck reaching upwards
    const neckBaseX = 14;
    const neckBaseY = 4;
    const headX = 26;
    const headY = -34;

    ctx.beginPath();
    ctx.moveTo(neckBaseX, neckBaseY);
    ctx.lineTo(headX, headY);
    ctx.stroke();

    // Mane ticks along neck (comb-like cross ticks from Image 2)
    const maneTicks = 7;
    for (let i = 1; i <= maneTicks; i++) {
      const t = i / (maneTicks + 1);
      const mx = neckBaseX + (headX - neckBaseX) * t;
      const my = neckBaseY + (headY - neckBaseY) * t;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - 8, my - 3);
      ctx.stroke();
    }

    // Horse Head: Oval angled upwards (Image 2)
    ctx.beginPath();
    ctx.ellipse(headX + 4, headY - 4, 10, 6, -0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Horse Ears
    ctx.beginPath();
    ctx.moveTo(headX, headY - 8);
    ctx.lineTo(headX - 3, headY - 16);
    ctx.stroke();

    // Stick Tail
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.lineTo(-38, 14 + gallop * 5);
    ctx.stroke();

    // Front Legs (Rearing / galloping in air)
    const frontLegLift = isMoving ? gallop * 12 : 0;
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.lineTo(26, 30 - frontLegLift);
    ctx.lineTo(36, 42 - frontLegLift); // front right leg
    ctx.moveTo(14, 16);
    ctx.lineTo(20, 26 + frontLegLift);
    ctx.lineTo(26, 38 + frontLegLift); // front left leg
    ctx.stroke();

    // Hind Legs (Ground planting legs)
    const hindLegKick = isMoving ? -gallop * 10 : 0;
    ctx.beginPath();
    ctx.moveTo(-14, 16);
    ctx.lineTo(-18, 36 + hindLegKick);
    ctx.lineTo(-24, 52 + hindLegKick); // hind left
    ctx.moveTo(-10, 16);
    ctx.lineTo(-12, 34 - hindLegKick);
    ctx.lineTo(-16, 50 - hindLegKick); // hind right
    ctx.stroke();

    // --- COWBOY RIDER (Mounted on back) ---
    // Rider Torso
    ctx.beginPath();
    ctx.ellipse(2, -8, 6.5, 14, 0.1, 0, Math.PI * 2);
    ctx.stroke();

    // Rider Head & Hat
    ctx.beginPath();
    ctx.ellipse(3, -28, 5, 7.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Hat
    ctx.beginPath();
    ctx.moveTo(-10, -35);
    ctx.lineTo(16, -35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, -35, 6.5, Math.PI, 0, false);
    ctx.stroke();

    // Rider Legs wrapped around horse
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(6, 16);
    ctx.lineTo(12, 22);
    ctx.stroke();

    // Left Arm holding reins to horse head
    ctx.beginPath();
    ctx.moveTo(-2, -18);
    ctx.lineTo(12, -12);
    ctx.lineTo(headX, headY);
    ctx.stroke();

    // Right Arm with Cutlas / Gun
    const rHandX = 14 + Math.cos(aimAngle - rearAngle) * 20;
    const rHandY = -18 + Math.sin(aimAngle - rearAngle) * 20;
    ctx.beginPath();
    ctx.moveTo(6, -18);
    ctx.lineTo(rHandX, rHandY);
    ctx.stroke();

    if (player.weapon === 'cutlas' || player.weapon === 'dual_cutlas' || player.weapon === 'razor_wave') {
      this.drawCutlas(rHandX, rHandY, aimAngle - rearAngle, player);
    } else {
      this.drawRevolver(rHandX, rHandY, aimAngle - rearAngle, player);
    }

    ctx.restore();

    // Sashing trail when mounted
    if (player.isSlashing) {
      this.drawSlashArc(player, aimAngle, colors);
    }
  }

  /** 3-finger splayed hand from attached Image 1 */
  private drawThreeFingerHand(x: number, y: number, armAngle: number) {
    const ctx = this.ctx;
    const fingerLen = 6.5;
    [-0.5, 0, 0.5].forEach((offset) => {
      const fAngle = armAngle + offset;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(fAngle) * fingerLen, y + Math.sin(fAngle) * fingerLen);
    });
  }

  /** Curved Cutlas blade with hilt crossguard */
  private drawCutlas(x: number, y: number, angle: number, player: Player, isOffhand: boolean = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Crossguard line
    ctx.lineWidth = player.lineThickness;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // Pommel / grip
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-7, 0);
    ctx.stroke();

    // Curved Cutlas Blade
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const bladeLength = player.slashRange * 0.65;
    // Curved belly of cutlas
    ctx.quadraticCurveTo(bladeLength * 0.6, -5, bladeLength, -1);
    ctx.quadraticCurveTo(bladeLength * 0.55, 3, 0, 0);
    ctx.stroke();

    ctx.restore();
  }

  /** Revolver pistol with barrel and cylinder */
  private drawRevolver(x: number, y: number, angle: number, player: Player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Grip
    ctx.lineWidth = player.lineThickness;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, 6);
    ctx.stroke();

    // Barrel
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 0);
    // Cylinder line
    ctx.moveTo(2, -3);
    ctx.lineTo(2, 3);
    ctx.stroke();

    ctx.restore();
  }

  /** Slash Arc visual trail */
  private drawSlashArc(player: Player, aimAngle: number, colors: ThemeColors) {
    const ctx = this.ctx;
    ctx.save();
    const progress = player.slashProgress;
    const radius = player.slashRange;
    const halfArc = player.slashArc / 2;
    const dir = player.slashSwingDir;

    const startA = aimAngle - halfArc * dir;
    const endA = aimAngle + halfArc * dir;
    const currentA = startA + (endA - startA) * progress;

    ctx.strokeStyle = colors.accentRed;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, startA, currentA, dir < 0);
    ctx.stroke();

    // Trailing razor lines
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.85, startA, currentA, dir < 0);
    ctx.stroke();

    ctx.restore();
  }

  /** Draw Enemy stick characters and creatures */
  public drawEnemy(enemy: Enemy, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const colors = this.getColors();
    const ex = enemy.x - cameraX;
    const ey = enemy.y - cameraY;

    ctx.save();
    ctx.translate(ex, ey);

    // Windup / telegraph attack flash
    if (enemy.windupTimer > 0) {
      ctx.strokeStyle = colors.accentRed;
      ctx.lineWidth = enemy.lineThickness + 1.5;
    } else {
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = enemy.lineThickness;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (enemy.type) {
      case 'bandit':
      case 'scout':
        this.drawBanditStick(enemy, colors);
        break;
      case 'vulture':
        this.drawVultureStick(enemy, colors);
        break;
      case 'snake':
        this.drawSnakeStick(enemy, colors);
        break;
      case 'brute':
        this.drawBruteStick(enemy, colors);
        break;
      case 'rider':
        this.drawEnemyRider(enemy, colors);
        break;
      case 'boss':
        this.drawBossOutlaw(enemy, colors);
        break;
    }

    // Health bar above enemy if damaged
    if (enemy.hp < enemy.maxHp) {
      const barW = 28 * (enemy.radius / 18);
      const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.strokeStyle = colors.inkSubtle;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-barW / 2, -enemy.radius - 12);
      ctx.lineTo(barW / 2, -enemy.radius - 12);
      ctx.stroke();

      ctx.strokeStyle = colors.accentRed;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-barW / 2, -enemy.radius - 12);
      ctx.lineTo(-barW / 2 + barW * hpRatio, -enemy.radius - 12);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** Stick Bandit with bandana mask and stick knife/gun */
  private drawBanditStick(enemy: Enemy, colors: ThemeColors) {
    const ctx = this.ctx;
    const walk = Math.sin(enemy.walkCycle) * 8;

    // Legs
    ctx.beginPath();
    ctx.moveTo(-3, 10);
    ctx.lineTo(-8 + walk, 28);
    ctx.lineTo(-14 + walk, 28);
    ctx.moveTo(3, 10);
    ctx.lineTo(8 - walk, 28);
    ctx.lineTo(14 - walk, 28);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.ellipse(0, -18, 5, 6.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bandana Mask (V-line across lower face)
    ctx.beginPath();
    ctx.moveTo(-5, -17);
    ctx.lineTo(0, -12);
    ctx.lineTo(5, -17);
    ctx.stroke();

    // Hat (Sombrero/bandit hat: wider curved brim)
    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.quadraticCurveTo(0, -22, 16, -24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -24);
    ctx.lineTo(0, -32);
    ctx.lineTo(7, -24);
    ctx.stroke();

    // Arms & Weapon
    const armX = Math.cos(enemy.angle) * 16;
    const armY = -8 + Math.sin(enemy.angle) * 16;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(armX, armY);
    // Knife or pistol
    ctx.lineTo(armX + Math.cos(enemy.angle) * 8, armY + Math.sin(enemy.angle) * 8);
    ctx.stroke();
  }

  /** Vulture enemy: flapping zigzag line wings, sharp curved beak */
  private drawVultureStick(enemy: Enemy, colors: ThemeColors) {
    const ctx = this.ctx;
    const flap = Math.sin(enemy.walkCycle * 2) * 16;

    // Head and beak
    ctx.beginPath();
    ctx.ellipse(8, 0, 6, 4, 0, 0, Math.PI * 2);
    ctx.moveTo(14, 0);
    ctx.lineTo(24, 4); // hooked beak
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 6, 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // Wings
    ctx.beginPath();
    // Left wing
    ctx.moveTo(-2, 0);
    ctx.lineTo(-12, -18 + flap);
    ctx.lineTo(-24, -28 + flap * 1.4);
    // Right wing
    ctx.moveTo(2, 0);
    ctx.lineTo(8, -18 + flap);
    ctx.lineTo(16, -28 + flap * 1.4);
    // Tail feathers
    ctx.moveTo(-12, 2);
    ctx.lineTo(-24, 6);
    ctx.moveTo(-12, 4);
    ctx.lineTo(-22, 10);
    ctx.stroke();
  }

  /** Rattlesnake enemy: sinusoidal wavy line with rattle tail and fangs */
  private drawSnakeStick(enemy: Enemy, colors: ThemeColors) {
    const ctx = this.ctx;
    ctx.save();
    ctx.rotate(enemy.angle);

    ctx.beginPath();
    const len = 40;
    const wave = Math.sin(enemy.walkCycle * 2.5);

    ctx.moveTo(-len / 2, 0);
    for (let x = -len / 2; x <= len / 2; x += 4) {
      const y = Math.sin((x / len) * Math.PI * 4 + enemy.walkCycle * 3) * 6;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Snake head
    ctx.beginPath();
    ctx.ellipse(len / 2 + 4, 0, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rattle at tail
    ctx.beginPath();
    ctx.arc(-len / 2 - 3, 0, 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /** Brute Outlaw: heavy stick frame with dual clubs or axes */
  private drawBruteStick(enemy: Enemy, colors: ThemeColors) {
    const ctx = this.ctx;
    const walk = Math.sin(enemy.walkCycle) * 6;

    // Thick torso
    ctx.beginPath();
    ctx.ellipse(0, -4, 12, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.ellipse(0, -28, 8, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Metal jaw plate
    ctx.beginPath();
    ctx.moveTo(-8, -25);
    ctx.lineTo(0, -18);
    ctx.lineTo(8, -25);
    ctx.stroke();

    // Heavy legs
    ctx.beginPath();
    ctx.moveTo(-8, 14);
    ctx.lineTo(-14 + walk, 34);
    ctx.lineTo(-22 + walk, 34);
    ctx.moveTo(8, 14);
    ctx.lineTo(14 - walk, 34);
    ctx.lineTo(22 - walk, 34);
    ctx.stroke();

    // Giant club arms
    const armX = Math.cos(enemy.angle) * 22;
    const armY = -10 + Math.sin(enemy.angle) * 22;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(armX, armY);
    // Heavy axe head
    ctx.lineTo(armX + 10, armY - 8);
    ctx.lineTo(armX + 14, armY + 8);
    ctx.lineTo(armX, armY);
    ctx.stroke();
  }

  /** Enemy Horse Rider: mounted bandit galloping on a stick horse */
  private drawEnemyRider(enemy: Enemy, colors: ThemeColors) {
    const ctx = this.ctx;
    const gallop = Math.sin(enemy.walkCycle * 2) * 8;

    // Horse body
    ctx.beginPath();
    ctx.ellipse(0, 10, 22, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Horse neck & head
    ctx.beginPath();
    ctx.moveTo(12, 4);
    ctx.lineTo(24, -20);
    ctx.ellipse(28, -24, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Horse legs
    ctx.beginPath();
    ctx.moveTo(14, 16);
    ctx.lineTo(22, 34 + gallop);
    ctx.moveTo(-14, 16);
    ctx.lineTo(-20, 34 - gallop);
    ctx.stroke();

    // Rider
    ctx.beginPath();
    ctx.ellipse(2, -6, 5, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(2, -24, 4.5, 6, 0, 0, Math.PI * 2);
    // Hat
    ctx.moveTo(-8, -30);
    ctx.lineTo(12, -30);
    ctx.stroke();

    // Gun aiming at player
    const gx = 2 + Math.cos(enemy.angle) * 18;
    const gy = -12 + Math.sin(enemy.angle) * 18;
    ctx.beginPath();
    ctx.moveTo(2, -12);
    ctx.lineTo(gx, gy);
    ctx.stroke();
  }

  /** Boss Outlaw "El Diablo": towering frame with skull mask and twin fiery cutlasses */
  private drawBossOutlaw(enemy: Enemy, colors: ThemeColors) {
    const ctx = this.ctx;
    const walk = Math.sin(enemy.walkCycle) * 10;

    // Massive torso
    ctx.beginPath();
    ctx.ellipse(0, -6, 16, 26, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Torso ribcage cross lines (skeletal look)
    for (let i = -18; i <= 8; i += 8) {
      ctx.beginPath();
      ctx.moveTo(-12, i);
      ctx.lineTo(12, i);
      ctx.stroke();
    }

    // Skull head
    ctx.beginPath();
    ctx.ellipse(0, -40, 11, 13, 0, 0, Math.PI * 2);
    // Eye sockets
    ctx.moveTo(-5, -42);
    ctx.lineTo(-3, -40);
    ctx.moveTo(3, -40);
    ctx.lineTo(5, -42);
    ctx.stroke();

    // Horned / Spiked Boss Sombrero
    ctx.beginPath();
    ctx.moveTo(-28, -50);
    ctx.quadraticCurveTo(0, -46, 28, -50);
    ctx.lineTo(14, -68);
    ctx.lineTo(-14, -68);
    ctx.closePath();
    ctx.stroke();

    // Giant legs
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.lineTo(-18 + walk, 54);
    ctx.lineTo(-30 + walk, 54);
    ctx.moveTo(10, 20);
    ctx.lineTo(18 - walk, 54);
    ctx.lineTo(30 - walk, 54);
    ctx.stroke();

    // Twin giant cutlasses
    const blade1Angle = enemy.angle - 0.4;
    const blade2Angle = enemy.angle + 0.4;
    [blade1Angle, blade2Angle].forEach((ang) => {
      const hx = Math.cos(ang) * 32;
      const hy = -15 + Math.sin(ang) * 32;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      // Long curved blade
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(28, -8, 48, -2);
      ctx.quadraticCurveTo(24, 6, 0, 0);
      ctx.stroke();
      ctx.restore();
    });
  }

  /** Draw Projectiles (Bullets, Razor Waves, Dynamite) */
  public drawProjectile(p: Projectile, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const colors = this.getColors();
    const px = p.x - cameraX;
    const py = p.y - cameraY;

    ctx.save();
    ctx.translate(px, py);

    if (p.isRazorWave) {
      // Sweeping razor wind crescent
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.strokeStyle = colors.accentRed;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, -Math.PI * 0.4, Math.PI * 0.4, false);
      ctx.stroke();
      // Inner line
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, 0, 18, -Math.PI * 0.35, Math.PI * 0.35, false);
      ctx.stroke();
    } else if (p.isDynamite) {
      // Dynamite stick with ticking fuse
      ctx.strokeStyle = colors.accentRed;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      // Burning fuse spark
      ctx.strokeStyle = colors.accentGold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(14, -4);
      ctx.stroke();
    } else {
      // Standard line bullet (bold high-velocity line segment)
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);
      ctx.strokeStyle = p.isPlayer ? colors.ink : colors.accentRed;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-p.length, 0);
      ctx.lineTo(p.length, 0);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** Draw Bounty items (Dropped ink coins with "$" or pentagram) */
  public drawBounty(item: BountyItem, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const colors = this.getColors();
    const bx = item.x - cameraX;
    const by = item.y - cameraY;

    ctx.save();
    ctx.translate(bx, by);

    // Subtle bobbing
    const bob = Math.sin(Date.now() * 0.008 + item.id) * 3;
    ctx.translate(0, bob);

    // Gold/ink circular coin ring
    ctx.strokeStyle = colors.accentGold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();

    // "$" sign inside coin
    ctx.font = 'bold 11px "Courier Prime", monospace';
    ctx.fillStyle = colors.accentGold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);

    ctx.restore();
  }

  /** Draw Particles & Splintered Line Physics */
  public drawParticle(p: Particle, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const colors = this.getColors();
    const px = p.x - cameraX;
    const py = p.y - cameraY;
    const alpha = Math.max(0, p.life / p.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.type === 'text' && p.text) {
      // Floating damage / crit / bounty text
      ctx.font = 'bold 14px "Courier Prime", monospace';
      ctx.fillStyle = p.color || colors.ink;
      ctx.textAlign = 'center';
      ctx.fillText(p.text, px, py);
    } else if (p.type === 'line') {
      // Splintered stick lines tumbling
      ctx.translate(px, py);
      ctx.rotate(p.angle);
      ctx.strokeStyle = p.color || colors.ink;
      ctx.lineWidth = p.lineWidth;
      ctx.beginPath();
      ctx.moveTo(-p.length / 2, 0);
      ctx.lineTo(p.length / 2, 0);
      ctx.stroke();
    } else if (p.type === 'smoke' || p.type === 'dust') {
      // Little line loops / dust rings
      ctx.strokeStyle = colors.inkSubtle;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, py, p.length * (1 - alpha * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Spark / blood dot
      ctx.fillStyle = p.color || colors.accentRed;
      ctx.beginPath();
      ctx.arc(px, py, p.lineWidth, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

import { SubPrimitive, CharacterIdentity, CHARACTER_STYLES, Vec2 } from './types25d';

export interface HumanoidRigState {
  x: number;
  y: number;
  facingDir: number; // 1 for right, -1 for left
  currentYaw: number; // 0 to Math.PI (interpolates when turning over 4 frames)
  aimAngle: number;
  walkCycle: number;
  isMoving: boolean;
  isShooting: boolean;
  isSlashing: boolean;
  weaponType?: 'revolver' | 'cutlas' | 'razor_wave' | string;
  isThinking: boolean;
  isMounted: boolean;
  slashProgress: number;
  identity: CharacterIdentity;
  timeSec: number;
  isGrounded?: boolean;
}

/**
 * Helper to draw the authentic 3-finger splayed hand from image.png
 * (Three bold, unmistakable fingers spreading outward like a trident/bird foot)
 */
export function drawThreeFingerHand(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  angle: number,
  size = 10,
  strokeWidth = 2.8,
  strokeColor = '#000000'
) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(angle);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Center finger (straight)
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);

  // Upper spread finger (~32 degrees)
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.9, -size * 0.55);

  // Lower spread finger (~32 degrees)
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.9, size * 0.55);

  ctx.stroke();
  ctx.restore();
}

/**
 * Humanoid 2.5D Rig - Exact match to user's uploaded reference (image.png):
 * 
 * 1. Head: Solid white vertical oval with black border, blank face (NO eye line),
 *    surmounted by a cowboy hat with a straight horizontal brim line and rounded dome crown.
 * 2. Torso: Tall elongated solid white vertical oval (ellipse), NOT a rectangle!
 * 3. Hip Holster: Blocky '7' shaped gun holster outline on the hip/upper thigh.
 * 4. Limbs: Stick limbs with crystal-clear 3-finger splayed hands (chicken-foot / crow's foot)
 *    and flat L-shaped boots.
 * 5. Side-Profile Occlusion: When walking or aiming sideways in profile, the back arm is
 *    100% hidden behind the solid white torso (zero pixels shown).
 * 6. Idle Stance: In idle/standing front view, BOTH arms and BOTH 3-finger hands are prominently visible!
 * 7. Dual Weapon: Holds either the minimalist black revolver or the curved cutlass sabre with fingers clearly visible!
 */
export class Humanoid25DRig {
  public static generatePrimitives(state: HumanoidRigState): SubPrimitive[] {
    const primitives: SubPrimitive[] = [];
    const style = CHARACTER_STYLES[state.identity] || CHARACTER_STYLES.cuttlas;

    // Direction: 1 (facing right) or -1 (facing left)
    const dir = state.facingDir >= 0 ? 1 : -1;

    // If Sitting/Thinking pose (iconic Calpurnio philosopher pose)
    if (state.isThinking && !state.isMounted) {
      return Humanoid25DRig.generateThinkingPrimitives(state, style, dir);
    }

    // Determine active weapon: default to 'revolver'
    const isRevolver = state.weaponType ? (state.weaponType === 'revolver') : state.isShooting;

    // --- 2D MOVEMENT & STRIDE DYNAMICS ---
    const isWalking = state.isMoving;
    const walkCycle = state.walkCycle;
    const isGrounded = state.isGrounded !== false;

    // Torso bobbing and slight forward lean during movement
    const torsoBobY = isWalking ? Math.abs(Math.sin(walkCycle * 2)) * 2.2 : 0;
    const torsoLean = isWalking ? 0.05 * dir : 0;

    const rootX = state.x;
    const rootY = state.y - torsoBobY;

    // Torso oval dimensions (elongated vertical oval from image.png)
    const torsoRx = 8.5;
    const torsoRy = 26.0;
    const torsoCenterY = rootY - 4;

    // Head oval dimensions (vertical oval directly on top of torso oval)
    const headRx = 6.5;
    const headRy = 10.5;
    const headX = rootX + (isWalking ? 1 * dir : 0);
    const headY = torsoCenterY - torsoRy - headRy + 1; // touching top tip of torso oval

    // Pelvis / hip attachment point is at the bottom tip of torso oval
    const hipY = torsoCenterY + torsoRy - 2;
    const groundY = hipY + 34;
    const stride = 14;
    const bootLen = 9 * dir;

    // Legs attachment: near center-bottom of torso oval
    let fHipX = rootX + 2.0 * dir;
    let bHipX = rootX - 2.0 * dir;

    let fKneeX: number, fKneeY: number, fFootX: number, fFootY: number;
    let bKneeX: number, bKneeY: number, bFootX: number, bFootY: number;

    if (!isGrounded) {
      // In-air jump pose (gravity leap): front leg bent up, back leg extended
      fKneeX = fHipX + 8 * dir;
      fKneeY = hipY + 12;
      fFootX = fHipX + 12 * dir;
      fFootY = hipY + 22;

      bKneeX = bHipX - 6 * dir;
      bKneeY = hipY + 16;
      bFootX = bHipX - 10 * dir;
      bFootY = hipY + 30;
    } else if (isWalking) {
      // Natural 2D cartoon walk cycle
      const fCycle = Math.sin(walkCycle);
      const bCycle = Math.sin(walkCycle + Math.PI); // opposite phase

      // Front Leg (near leg, in front of torso)
      fFootX = fHipX + fCycle * stride * dir;
      const fLift = Math.max(0, fCycle) * 5.5;
      fFootY = groundY - fLift;
      fKneeX = (fHipX + fFootX) / 2 + 2.0 * dir;
      fKneeY = (hipY + fFootY) / 2 - 1.5;

      // Back Leg (far leg, behind torso)
      bFootX = bHipX + bCycle * stride * dir;
      const bLift = Math.max(0, bCycle) * 5.5;
      bFootY = groundY - bLift;
      bKneeX = (bHipX + bFootX) / 2 + 2.0 * dir;
      bKneeY = (hipY + bFootY) / 2 - 1.5;
    } else {
      // Relaxed stance matching image.png: inverted V legs with flat horizontal feet
      fFootX = fHipX + 8.0 * dir;
      fFootY = groundY;
      fKneeX = (fHipX + fFootX) / 2;
      fKneeY = (hipY + fFootY) / 2;

      bFootX = bHipX - 8.0 * dir;
      bFootY = groundY;
      bKneeX = (bHipX + bFootX) / 2;
      bKneeY = (hipY + bFootY) / 2;
    }

    // --- 1. BACK LEG (Depth Z = +1.0, drawn behind torso) ---
    // The top joint connects at hipY and upper thigh is hidden behind solid white torso!
    primitives.push({
      id: `${state.identity}_back_leg`,
      depthZ: 1.0,
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.6,
      points: [
        { x: bHipX, y: hipY },
        { x: bKneeX, y: bKneeY },
        { x: bFootX, y: bFootY },
        { x: bFootX + (isWalking ? bootLen : -8 * dir), y: bFootY },
      ],
    });

    // --- 2. BACK ARM (Other Arm) ---
    // User requirement:
    // "وقتی به سمت راست یا چپ حرکت میکنند دست پشتش بخشیش نباید مشخص باشه"
    // "دست های کاراکتر هنوز مشخص نیست"
    // When MOVING horizontally in 2D profile (isWalking = true):
    // The back arm is occluded behind the torso so it does not poke out behind the back.
    // When STANDING IDLE (isWalking = false):
    // BOTH arms are visible in front of / beside the body as in image.png, with crystal-clear 3-finger hands!
    if (!isWalking) {
      const backShoulderX = rootX - 3.5 * dir;
      const backShoulderY = torsoCenterY - torsoRy + 4;
      const backArmAngle = dir > 0 ? Math.PI - 0.75 : 0.75;
      const backArmLen = 22;
      const backHandX = backShoulderX + Math.cos(backArmAngle) * backArmLen;
      const backHandY = backShoulderY + Math.sin(backArmAngle) * backArmLen;

      primitives.push({
        id: `${state.identity}_back_arm`,
        depthZ: 0.8, // Drawn behind torso
        type: 'stroke_polyline',
        strokeColor: style.limbStroke,
        strokeWidth: 2.6,
        points: [
          { x: backShoulderX, y: backShoulderY },
          { x: backHandX, y: backHandY },
        ],
        customDraw: (ctx) => {
          // Draw bold, crystal-clear 3-finger splayed hand from image.png
          drawThreeFingerHand(ctx, backHandX, backHandY, backArmAngle, 10.5, 2.8, '#000000');
        },
      });
    }

    // --- 3. TORSO & PELVIS (Solid Opaque White Vertical Oval from image.png) ---
    primitives.push({
      id: `${state.identity}_torso`,
      depthZ: 0.0, // Torso sits at depth 0
      type: 'solid_polygon',
      fillColor: style.torsoFill,
      strokeColor: style.torsoStroke,
      strokeWidth: 2.8,
      customDraw: (ctx) => {
        ctx.save();
        ctx.translate(rootX, torsoCenterY);
        ctx.rotate(torsoLean);

        // Elongated vertical oval torso from image.png
        ctx.beginPath();
        ctx.ellipse(0, 0, torsoRx, torsoRy, 0, 0, Math.PI * 2);
        ctx.fillStyle = style.torsoFill;
        ctx.fill();
        ctx.strokeStyle = style.torsoStroke;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Hip holster (Blocky '7' shape on hip from image.png)
        ctx.beginPath();
        ctx.moveTo(-4 * dir, 6);
        ctx.lineTo(-14 * dir, 6);
        ctx.lineTo(-14 * dir, 22);
        ctx.lineTo(-9 * dir, 22);
        ctx.lineTo(-9 * dir, 13);
        ctx.lineTo(-4 * dir, 13);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = style.torsoStroke;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.restore();
      },
    });

    // --- 4. HEAD & COWBOY HAT (Solid Opaque White Oval + Hat from image.png) ---
    primitives.push({
      id: `${state.identity}_head_and_hat`,
      depthZ: -0.2, // Head & Hat sit in front of torso
      type: 'solid_polygon',
      fillColor: style.headFill,
      strokeColor: style.headStroke,
      strokeWidth: 2.6,
      customDraw: (ctx) => {
        ctx.save();
        ctx.translate(headX, headY);

        // Head: Solid vertical oval from image.png (blank face, no eye line)
        ctx.beginPath();
        ctx.ellipse(0, 0, headRx, headRy, 0, 0, Math.PI * 2);
        ctx.fillStyle = style.headFill;
        ctx.fill();
        ctx.strokeStyle = style.headStroke;
        ctx.lineWidth = 2.6;
        ctx.stroke();

        // Only draw eye line if character style specifically requests it (cuttlas is false)
        if (style.eyeLine) {
          ctx.beginPath();
          ctx.moveTo(1 * dir, -1);
          ctx.lineTo(4 * dir, -1);
          ctx.strokeStyle = style.headStroke;
          ctx.lineWidth = 2.0;
          ctx.stroke();
        }

        // Cowboy Hat from image.png: straight horizontal brim line + dome crown
        if (style.hasHat) {
          const hatFill = style.hatFill || '#FFFFFF';
          const hatStroke = style.hatStroke || '#000000';

          // Hat Crown: rounded arch dome on top of brim
          ctx.beginPath();
          ctx.arc(0, -headRy + 1, 7.5, Math.PI, 0, false);
          ctx.closePath();
          ctx.fillStyle = hatFill;
          ctx.fill();
          ctx.strokeStyle = hatStroke;
          ctx.lineWidth = 2.6;
          ctx.stroke();

          // Hat Brim: clean straight horizontal line crossing top of head (from image.png)
          ctx.beginPath();
          ctx.moveTo(-18, -headRy + 1);
          ctx.lineTo(18, -headRy + 1);
          ctx.strokeStyle = hatStroke;
          ctx.lineWidth = 2.8;
          ctx.stroke();
        }

        ctx.restore();
      },
    });

    // --- 5. FRONT LEG (Near Leg, Z = -0.5, drawn in front of torso) ---
    primitives.push({
      id: `${state.identity}_front_leg`,
      depthZ: -0.5,
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.6,
      points: [
        { x: fHipX, y: hipY },
        { x: fKneeX, y: fKneeY },
        { x: fFootX, y: fFootY },
        { x: fFootX + (isWalking ? bootLen : 8 * dir), y: fFootY },
      ],
    });

    // --- 6. FRONT ARM & WEAPON (Revolver or Cutlass Sword) ---
    // Shoulder connects at the top of the torso oval
    const shoulderX = rootX + 2.5 * dir;
    const shoulderY = torsoCenterY - torsoRy + 3;

    // Angle of arm in forward direction:
    let armTargetAngle: number;
    if (state.isSlashing) {
      // Dynamic sword slash swing
      const slashPhase = state.slashProgress || 0;
      const startAngle = dir > 0 ? -0.8 : Math.PI + 0.8;
      const endAngle = dir > 0 ? 0.9 : Math.PI - 0.9;
      armTargetAngle = startAngle + (endAngle - startAngle) * slashPhase;
    } else if (state.isShooting || Math.abs(state.aimAngle) > 0.05) {
      // Aiming towards target, clamped strictly to forward hemisphere
      let relAim = state.aimAngle;
      if (dir < 0) {
        if (relAim < 0) relAim += Math.PI * 2;
        relAim = Math.max(Math.PI * 0.55, Math.min(Math.PI * 1.45, relAim));
      } else {
        if (relAim > Math.PI) relAim -= Math.PI * 2;
        if (relAim < -Math.PI) relAim += Math.PI * 2;
        relAim = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, relAim));
      }
      armTargetAngle = relAim;
    } else {
      // Natural stance angle from image.png: arm angled downwards and outwards holding gun
      armTargetAngle = dir > 0 ? 0.72 : Math.PI - 0.72;
    }

    const armLength = state.isShooting ? 24 : 22;
    const handX = shoulderX + Math.cos(armTargetAngle) * armLength;
    const handY = shoulderY + Math.sin(armTargetAngle) * armLength;

    primitives.push({
      id: `${state.identity}_front_arm_and_weapon`,
      depthZ: -0.8, // In front of everything on character
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.6,
      points: [
        { x: shoulderX, y: shoulderY },
        { x: handX, y: handY },
      ],
      customDraw: (ctx) => {
        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(armTargetAngle);

        if (isRevolver) {
          // ==============================================================
          // MINIMALIST BLACK REVOLVER (Calpurnio "El Bueno de Cuttlas")
          // Positioned so the hand grasps the grip with all 3 fingers clearly visible!
          // ==============================================================
          ctx.fillStyle = '#000000';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.8;

          // Grip angled downwards from palm
          ctx.beginPath();
          ctx.moveTo(-1, 0);
          ctx.lineTo(-4, 9);
          ctx.lineTo(-1, 10);
          ctx.lineTo(2, 3);
          ctx.closePath();
          ctx.fill();

          // Frame & Cylinder extending in front of hand
          ctx.fillRect(1, -3.5, 6, 6);

          // Barrel
          ctx.fillRect(7, -2, 10, 3);

          // Front sight tip
          ctx.fillRect(15, -4, 2, 2);

          // Trigger guard
          ctx.beginPath();
          ctx.arc(3, 3, 3, 0, Math.PI, false);
          ctx.stroke();

          // Muzzle flash recoil starburst if just fired
          if (state.isShooting) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(19, -0.5, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // --- CRYSTAL CLEAR 3-FINGER SPLAYED HAND GRASPING THE REVOLVER ---
          // Drawn with bold black lines wrapping over the weapon grip
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          // Index finger along frame/trigger
          ctx.moveTo(-1, -1);
          ctx.lineTo(9, -0.5);
          // Middle finger grasping grip
          ctx.moveTo(-1, 1.5);
          ctx.lineTo(8, 3.5);
          // Lower finger grasping lower grip
          ctx.moveTo(-1, 4);
          ctx.lineTo(7, 7.5);
          ctx.stroke();
        } else {
          // ==============================================================
          // CURVED CUTLASS SABRE (Namesake weapon of Cuttlas)
          // ==============================================================
          // Handle / grip
          ctx.fillStyle = '#000000';
          ctx.fillRect(-7, -2, 7, 4);

          // Curved handguard basket
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(-2, 0, 6.5, -Math.PI * 0.5, Math.PI * 0.5, false);
          ctx.stroke();

          // Gleaming curved sabre blade: solid white fill with crisp black outline
          ctx.beginPath();
          ctx.moveTo(0, -2);
          ctx.lineTo(0, 2);
          ctx.quadraticCurveTo(18, 5, 28, 1);
          ctx.lineTo(34, -3); // Sharp point
          ctx.quadraticCurveTo(16, -6, 0, -2);
          ctx.closePath();
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // --- CRYSTAL CLEAR 3-FINGER SPLAYED HAND GRASPING THE SABRE HILT ---
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          // Upper finger
          ctx.moveTo(-2, -2);
          ctx.lineTo(5, -4);
          // Center finger
          ctx.moveTo(-2, 0);
          ctx.lineTo(6, 0);
          // Lower finger
          ctx.moveTo(-2, 2);
          ctx.lineTo(5, 4);
          ctx.stroke();
        }

        ctx.restore();
      },
    });

    return primitives;
  }

  /**
   * Sitting & Thinking Pose: Calpurnio's iconic philosopher cowboy
   * Sitting on the sand with oval torso tilted thoughtfully and chin on 3-finger hand
   */
  private static generateThinkingPrimitives(state: HumanoidRigState, style: typeof CHARACTER_STYLES['cuttlas'], dir: number): SubPrimitive[] {
    const primitives: SubPrimitive[] = [];

    // Folded Legs on ground (Z = 1.0, behind torso)
    primitives.push({
      id: `${state.identity}_thinking_legs`,
      depthZ: 1.0,
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.6,
      points: [
        { x: state.x - 4 * dir, y: state.y + 12 },
        { x: state.x - 14 * dir, y: state.y + 24 },
        { x: state.x + 8 * dir, y: state.y + 24 },
      ],
    });

    // Solid White Elongated Oval Torso (tilted thoughtfully)
    primitives.push({
      id: `${state.identity}_thinking_torso`,
      depthZ: 0.0,
      type: 'solid_polygon',
      fillColor: style.torsoFill,
      strokeColor: style.torsoStroke,
      strokeWidth: 2.8,
      customDraw: (ctx) => {
        ctx.save();
        ctx.translate(state.x, state.y);
        ctx.rotate(0.12 * dir);

        ctx.beginPath();
        ctx.ellipse(0, 0, 8.5, 25, 0, 0, Math.PI * 2);
        ctx.fillStyle = style.torsoFill;
        ctx.fill();
        ctx.strokeStyle = style.torsoStroke;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        ctx.restore();
      },
    });

    // Solid White Oval Head with Horizontal Brim Hat
    primitives.push({
      id: `${state.identity}_thinking_head`,
      depthZ: -0.2,
      type: 'solid_polygon',
      fillColor: style.headFill,
      strokeColor: style.headStroke,
      strokeWidth: 2.6,
      customDraw: (ctx) => {
        ctx.save();
        const headX = state.x + 5 * dir;
        const headY = state.y - 36;
        ctx.translate(headX, headY);
        ctx.rotate(0.15 * dir);

        // Blank white oval head
        ctx.beginPath();
        ctx.ellipse(0, 0, 6.5, 10.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = style.headFill;
        ctx.fill();
        ctx.strokeStyle = style.headStroke;
        ctx.lineWidth = 2.6;
        ctx.stroke();

        // Hat
        const hatFill = style.hatFill || '#FFFFFF';
        const hatStroke = style.hatStroke || '#000000';

        ctx.beginPath();
        ctx.arc(0, -9.5, 7.5, Math.PI, 0, false);
        ctx.closePath();
        ctx.fillStyle = hatFill;
        ctx.fill();
        ctx.strokeStyle = hatStroke;
        ctx.lineWidth = 2.6;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-18, -9.5);
        ctx.lineTo(18, -9.5);
        ctx.strokeStyle = hatStroke;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        ctx.restore();
      },
    });

    // Arm supporting chin in philosophical contemplation, with 3-finger hand touching chin
    primitives.push({
      id: `${state.identity}_thinking_arm`,
      depthZ: -0.8,
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.6,
      points: [
        { x: state.x + 2 * dir, y: state.y - 18 },
        { x: state.x + 14 * dir, y: state.y - 12 },
        { x: state.x + 5 * dir, y: state.y - 28 }, // hand under chin
      ],
      customDraw: (ctx) => {
        // 3-finger hand resting under chin
        drawThreeFingerHand(ctx, state.x + 5 * dir, state.y - 28, -0.6 * dir, 9.5, 2.6, '#000000');
      },
    });

    return primitives;
  }
}

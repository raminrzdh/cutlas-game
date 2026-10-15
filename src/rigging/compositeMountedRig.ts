import { SubPrimitive, CharacterIdentity, CHARACTER_STYLES } from './types25d';

export interface MountedRigState {
  x: number;
  y: number;
  facingDir: number;
  stridePhase: number;
  isMoving: boolean;
  isCantering: boolean;
  aimAngle: number;
  isShooting: boolean;
  isSlashing: boolean;
  identity: CharacterIdentity;
  timeSec: number;
}

/**
 * Composite Mounting System: Cuttlas Riding the White Stallion
 * 
 * Merges the rider and mount into a single unified depth-sorted stack (Back-to-Front):
 * [Layer 1 (Z = +6.0 to +4.0)]: Far Horse Legs + Cuttlas's Far Arm & Far Leg
 * [Layer 2 (Z = 0.0)]: Horse Solid White Body & Neck (occludes far limbs completely)
 * [Layer 3 (Z = -0.5 to -1.0)]: Cuttlas's Solid White Torso & Head sitting on saddle
 * [Layer 4 (Z = -4.0 to -6.0)]: Near Horse Legs + Cuttlas's Near Leg (overlapping horse's belly) & Near Arm holding reins/gun
 */
export class CompositeMountedRig {
  public static generatePrimitives(state: MountedRigState): SubPrimitive[] {
    const primitives: SubPrimitive[] = [];
    const style = CHARACTER_STYLES[state.identity] || CHARACTER_STYLES.cuttlas;

    const dir = state.facingDir;
    // 12 FPS discrete time quantization
    const walkPhase = Math.floor(state.stridePhase / (Math.PI / 4)) * (Math.PI / 4);
    const speedMult = state.isCantering ? 1.6 : 1.0;

    // Spine & Head Bobbing
    const spineBobY = state.isMoving ? Math.sin(walkPhase * 2) * 4.5 : 0;
    const neckPitch = state.isMoving ? Math.sin(walkPhase) * 0.08 : -0.05;

    const horseX = state.x;
    const horseY = state.y + spineBobY;

    // 4-beat walk / 3-beat canter phases
    const legPhaseFarHind = walkPhase;
    const legPhaseFarFront = walkPhase + (state.isCantering ? 0.8 : Math.PI * 0.5);
    const legPhaseNearHind = walkPhase + Math.PI;
    const legPhaseNearFront = walkPhase + (state.isCantering ? Math.PI + 0.8 : Math.PI * 1.5);

    const legSwingFarHind = state.isMoving ? Math.sin(legPhaseFarHind) * 0.65 : 0;
    const legSwingFarFront = state.isMoving ? Math.sin(legPhaseFarFront) * 0.65 : 0;
    const legSwingNearHind = state.isMoving ? Math.sin(legPhaseNearHind) * 0.65 : 0;
    const legSwingNearFront = state.isMoving ? Math.sin(legPhaseNearFront) * 0.65 : 0;

    const upperLegLen = 19;
    const lowerLegLen = 19;

    // =========================================================================
    // LAYER 1: FAR ELEMENTS (Depth Z: +6.0 to +4.0)
    // Drawn FIRST, behind horse's solid body
    // Includes: Far Horse Legs, Horse Tail, Cuttlas Far Leg, Cuttlas Far Arm
    // =========================================================================

    // 1A. Far-Back Horse Leg (Z = +5.5)
    const farHindHipX = horseX - 18 * dir;
    const farHindHipY = horseY + 8;
    const farHindKneeX = farHindHipX + Math.sin(legSwingFarHind) * upperLegLen * dir;
    const farHindKneeY = farHindHipY + Math.cos(legSwingFarHind) * upperLegLen;
    const farHindHoofX = farHindKneeX + Math.sin(legSwingFarHind * 0.8) * lowerLegLen * dir;
    const farHindHoofY = farHindKneeY + Math.cos(legSwingFarHind * 0.8) * lowerLegLen;

    primitives.push({
      id: 'mounted_horse_far_hind_leg',
      depthZ: 5.5,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.8,
      points: [
        { x: farHindHipX, y: farHindHipY },
        { x: farHindKneeX, y: farHindKneeY },
        { x: farHindHoofX, y: farHindHoofY },
        { x: farHindHoofX + 5 * dir, y: farHindHoofY },
      ],
    });

    // 1B. Far-Front Horse Leg (Z = +5.5)
    const farFrontShoulderX = horseX + 16 * dir;
    const farFrontShoulderY = horseY + 8;
    const farFrontKneeX = farFrontShoulderX + Math.sin(legSwingFarFront) * upperLegLen * dir;
    const farFrontKneeY = farFrontShoulderY + Math.cos(legSwingFarFront) * upperLegLen;
    const farFrontHoofX = farFrontKneeX + Math.sin(legSwingFarFront * 0.8) * lowerLegLen * dir;
    const farFrontHoofY = farFrontKneeY + Math.cos(legSwingFarFront * 0.8) * lowerLegLen;

    primitives.push({
      id: 'mounted_horse_far_front_leg',
      depthZ: 5.5,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.8,
      points: [
        { x: farFrontShoulderX, y: farFrontShoulderY },
        { x: farFrontKneeX, y: farFrontKneeY },
        { x: farFrontHoofX, y: farFrontHoofY },
        { x: farFrontHoofX + 5 * dir, y: farFrontHoofY },
      ],
    });

    // 1C. Horse Tail (Z = 5.0)
    const tailWag = state.isMoving ? Math.sin(walkPhase * 2) * 8 : 0;
    primitives.push({
      id: 'mounted_horse_tail',
      depthZ: 5.0,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.6,
      points: [
        { x: horseX - 26 * dir, y: horseY + 6 },
        { x: horseX - 38 * dir, y: horseY + 12 + tailWag },
        { x: horseX - 44 * dir, y: horseY + 24 + tailWag },
      ],
    });

    // 1D. Cuttlas Far Leg (Z = 4.2)
    // Sits in saddle on far side, partially hidden by horse barrel
    const riderSaddleX = horseX - 2 * dir;
    const riderSaddleY = horseY - 6;

    primitives.push({
      id: 'mounted_rider_far_leg',
      depthZ: 4.2,
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.5,
      points: [
        { x: riderSaddleX - 2 * dir, y: riderSaddleY + 8 },
        { x: riderSaddleX + 8 * dir, y: riderSaddleY + 20 },
        { x: riderSaddleX + 14 * dir, y: riderSaddleY + 30 },
        { x: riderSaddleX + 19 * dir, y: riderSaddleY + 30 }, // Far stirrup foot
      ],
    });

    // 1E. Cuttlas Far Arm (Z = 4.0) holding reins forward
    const riderShoulderY = riderSaddleY - 24;
    const farReinsHandX = horseX + 14 * dir;
    const farReinsHandY = horseY - 14;

    primitives.push({
      id: 'mounted_rider_far_arm',
      depthZ: 4.0,
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.4,
      points: [
        { x: riderSaddleX - 4 * dir, y: riderShoulderY },
        { x: riderSaddleX + 6 * dir, y: riderShoulderY + 8 },
        { x: farReinsHandX, y: farReinsHandY },
      ],
    });

    // =========================================================================
    // LAYER 2: HORSE SOLID OPAQUE WHITE BODY & NECK (Depth Z: 0.0)
    // Masks far horse legs, rider far leg, and desert background!
    // =========================================================================
    const barrelW = 56;
    const barrelH = 26;

    primitives.push({
      id: 'mounted_horse_solid_barrel_neck',
      depthZ: 0.0,
      type: 'solid_polygon',
      fillColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3.0,
      customDraw: (ctx) => {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Solid capsule / rounded-rectangle barrel
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(horseX - (barrelW / 2) * dir, horseY - barrelH / 2 + 6, barrelW * dir, barrelH, 13);
        } else {
          ctx.ellipse(horseX, horseY + 6, 28, 13, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        // Saddle pad outline on horse's back
        ctx.beginPath();
        ctx.rect(riderSaddleX - 9 * dir, horseY - 7, 18 * dir, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.stroke();

        // Neck
        const neckBaseX = horseX + 16 * dir;
        const neckBaseY = horseY + 4;
        const headX = horseX + 32 * dir;
        const headY = horseY - 32;

        ctx.save();
        ctx.translate(neckBaseX, neckBaseY);
        ctx.rotate(neckPitch * dir);

        ctx.beginPath();
        ctx.moveTo(-6 * dir, 0);
        ctx.lineTo((headX - neckBaseX), (headY - neckBaseY) + 6);
        ctx.lineTo((headX - neckBaseX) + 8 * dir, (headY - neckBaseY));
        ctx.lineTo(8 * dir, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mane comb ticks
        const maneTicks = 7;
        for (let i = 1; i <= maneTicks; i++) {
          const t = i / (maneTicks + 1);
          const mx = -6 * dir + (headX - neckBaseX) * t;
          const my = (headY - neckBaseY + 6) * t;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(mx - 8 * dir, my - 2);
          ctx.stroke();
        }

        // Horse Head
        ctx.save();
        ctx.translate((headX - neckBaseX) + 6 * dir, (headY - neckBaseY));
        ctx.rotate(-0.45 * dir);

        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ears
        ctx.beginPath();
        ctx.moveTo(-4 * dir, -4);
        ctx.lineTo(-7 * dir, -13);
        ctx.lineTo(-2 * dir, -5);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        ctx.restore();

        ctx.restore();
      },
    });

    // =========================================================================
    // LAYER 3: CUTTLAS SOLID WHITE TORSO & HEAD SITTING ON SADDLE (Depth Z: -0.5 to -1.0)
    // Sits directly on saddle. Its opaque white fill and crisp black outline
    // cleanly separate it from the horse's white back (White-on-White overlap)
    // =========================================================================
    const riderTorsoX = riderSaddleX;
    const riderTorsoY = riderSaddleY - 14;

    primitives.push({
      id: 'mounted_rider_torso',
      depthZ: -0.6,
      type: 'solid_polygon',
      fillColor: style.torsoFill,
      strokeColor: style.torsoStroke,
      strokeWidth: 2.6,
      customDraw: (ctx) => {
        ctx.save();
        ctx.translate(riderTorsoX, riderTorsoY);
        // Slight forward rider lean
        ctx.rotate(0.08 * dir);

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-7.5, -16, 15, 30, 2.5);
        } else {
          ctx.rect(-7.5, -16, 15, 30);
        }
        ctx.fillStyle = style.torsoFill;
        ctx.fill();
        ctx.strokeStyle = style.torsoStroke;
        ctx.stroke();

        // Hip holster
        ctx.beginPath();
        ctx.moveTo(-7.5 * dir, 4);
        ctx.lineTo(-13 * dir, 4);
        ctx.lineTo(-13 * dir, 14);
        ctx.lineTo(-7.5 * dir, 14);
        ctx.stroke();

        ctx.restore();
      },
    });

    // Rider Head & Hat
    const riderHeadX = riderTorsoX + 2 * dir;
    const riderHeadY = riderTorsoY - 26;

    primitives.push({
      id: 'mounted_rider_head',
      depthZ: -0.8,
      type: 'solid_polygon',
      fillColor: style.headFill,
      strokeColor: style.headStroke,
      strokeWidth: 2.6,
      customDraw: (ctx) => {
        ctx.save();
        ctx.translate(riderHeadX, riderHeadY);

        // Head ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, 5.5, 8.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = style.headFill;
        ctx.fill();
        ctx.strokeStyle = style.headStroke;
        ctx.stroke();

        // Eye line
        if (style.eyeLine) {
          ctx.beginPath();
          ctx.moveTo(-2.2 * dir, 0);
          ctx.lineTo(2.2 * dir, 0);
          ctx.stroke();
        }

        // Cowboy Hat
        if (style.hasHat) {
          // Brim
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-18, -9, 36, 2.5, 1);
          } else {
            ctx.rect(-18, -9, 36, 2.5);
          }
          ctx.fillStyle = style.hatFill || '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = style.hatStroke || '#000000';
          ctx.stroke();

          // Crown
          ctx.beginPath();
          ctx.arc(0, -9, 7.5, Math.PI, 0, false);
          ctx.fillStyle = style.hatFill || '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = style.hatStroke || '#000000';
          ctx.stroke();
        }

        ctx.restore();
      },
    });

    // =========================================================================
    // LAYER 4: NEAR ELEMENTS (Depth Z: -4.0 to -6.0)
    // Drawn LAST, IN FRONT OF horse's white body
    // Includes: Near Horse Legs, Cuttlas Near Leg (overlapping horse's belly),
    // and Cuttlas Near Arm holding weapon/reins
    // =========================================================================

    // 4A. Cuttlas Near Leg (Z = -4.2)
    // Sits in front of horse's white belly! Clean black line clearly visible over white fill
    primitives.push({
      id: 'mounted_rider_near_leg',
      depthZ: -4.2,
      type: 'stroke_polyline',
      strokeColor: style.limbStroke,
      strokeWidth: 2.6,
      points: [
        { x: riderSaddleX + 1 * dir, y: riderSaddleY + 4 },
        { x: riderSaddleX + 8 * dir, y: riderSaddleY + 16 },
        { x: riderSaddleX + 12 * dir, y: riderSaddleY + 28 },
        { x: riderSaddleX + 18 * dir, y: riderSaddleY + 28 }, // Near stirrup foot
      ],
    });

    // 4B. Near-Back Horse Leg (Z = -5.0)
    const nearHindHipX = horseX - 14 * dir;
    const nearHindHipY = horseY + 6;
    const nearHindKneeX = nearHindHipX + Math.sin(legSwingNearHind) * upperLegLen * dir;
    const nearHindKneeY = nearHindHipY + Math.cos(legSwingNearHind) * upperLegLen;
    const nearHindHoofX = nearHindKneeX + Math.sin(legSwingNearHind * 0.8) * lowerLegLen * dir;
    const nearHindHoofY = nearHindKneeY + Math.cos(legSwingNearHind * 0.8) * lowerLegLen;

    primitives.push({
      id: 'mounted_horse_near_hind_leg',
      depthZ: -5.0,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.8,
      points: [
        { x: nearHindHipX, y: nearHindHipY },
        { x: nearHindKneeX, y: nearHindKneeY },
        { x: nearHindHoofX, y: nearHindHoofY },
        { x: nearHindHoofX + 5 * dir, y: nearHindHoofY },
      ],
    });

    // 4C. Near-Front Horse Leg (Z = -5.0)
    const nearFrontShoulderX = horseX + 18 * dir;
    const nearFrontShoulderY = horseY + 6;
    const nearFrontKneeX = nearFrontShoulderX + Math.sin(legSwingNearFront) * upperLegLen * dir;
    const nearFrontKneeY = nearFrontShoulderY + Math.cos(legSwingNearFront) * upperLegLen;
    const nearFrontHoofX = nearFrontKneeX + Math.sin(legSwingNearFront * 0.8) * lowerLegLen * dir;
    const nearFrontHoofY = nearFrontKneeY + Math.cos(legSwingNearFront * 0.8) * lowerLegLen;

    primitives.push({
      id: 'mounted_horse_near_front_leg',
      depthZ: -5.0,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.8,
      points: [
        { x: nearFrontShoulderX, y: nearFrontShoulderY },
        { x: nearFrontKneeX, y: nearFrontKneeY },
        { x: nearFrontHoofX, y: nearFrontHoofY },
        { x: nearFrontHoofX + 5 * dir, y: nearFrontHoofY },
      ],
    });

    // 4D. Cuttlas Near Arm (Weapon / Reins Arm, Z = -5.5)
    const riderNearShoulderX = riderTorsoX + 5 * dir;
    const riderNearShoulderY = riderShoulderY;
    const armLen = state.isShooting ? 25 : 20;
    const weaponHandX = riderNearShoulderX + Math.cos(state.aimAngle) * armLen;
    const weaponHandY = riderNearShoulderY + Math.sin(state.aimAngle) * armLen;

    primitives.push({
      id: 'mounted_rider_near_arm',
      depthZ: -5.5,
      type: 'stroke_line',
      strokeColor: style.limbStroke,
      strokeWidth: 2.5,
      points: [
        { x: riderNearShoulderX, y: riderNearShoulderY },
        { x: weaponHandX, y: weaponHandY },
      ],
      customDraw: (ctx) => {
        // Reins line connecting from horse neck to hand
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(horseX + 28 * dir, horseY - 22);
        ctx.quadraticCurveTo(horseX + 18 * dir, horseY - 6, weaponHandX, weaponHandY);
        ctx.stroke();

        // Weapon
        ctx.translate(weaponHandX, weaponHandY);
        ctx.rotate(state.aimAngle);
        if (state.isShooting) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(-3, 0, 4, 7);
          ctx.fillRect(0, -3.5, 5, 7);
          ctx.fillRect(5, -2, 8, 4);
        } else {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(0, 5);
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(20, -5, 34, -2);
          ctx.quadraticCurveTo(18, 4, 0, 0);
          ctx.stroke();
        }
        ctx.restore();
      },
    });

    return primitives;
  }
}

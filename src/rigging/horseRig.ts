import { SubPrimitive, Vec2 } from './types25d';

export interface HorseRigState {
  x: number;
  y: number;
  facingDir: number;
  stridePhase: number;
  isMoving: boolean;
  isCantering: boolean; // 3-beat canter vs 4-beat walk
  timeSec: number;
}

export class Horse25DRig {
  private static readonly FPS_STEP = 1 / 12;

  public static generatePrimitives(state: HorseRigState): SubPrimitive[] {
    const primitives: SubPrimitive[] = [];

    // 12 FPS discrete time quantization
    const walkPhase = Math.floor(state.stridePhase / (Math.PI / 4)) * (Math.PI / 4);
    const speedMultiplier = state.isCantering ? 1.8 : 1.0;

    // Spine & head bobbing synced with gait phase
    const spineBobY = state.isMoving ? Math.sin(walkPhase * 2) * 4.5 : 0;
    const neckPitch = state.isMoving ? Math.sin(walkPhase) * 0.08 : -0.05;

    const dir = state.facingDir;
    const horseX = state.x;
    const horseY = state.y + spineBobY;

    // 3D phase-shifted pendulum leg angles
    // 4-beat walk: Left-Hind (0), Left-Fore (PI/2), Right-Hind (PI), Right-Fore (3PI/2)
    const legPhaseFarHind = walkPhase;
    const legPhaseFarFront = walkPhase + (state.isCantering ? 0.8 : Math.PI * 0.5);
    const legPhaseNearHind = walkPhase + Math.PI;
    const legPhaseNearFront = walkPhase + (state.isCantering ? Math.PI + 0.8 : Math.PI * 1.5);

    const legSwingFarHind = state.isMoving ? Math.sin(legPhaseFarHind) * 0.6 : 0;
    const legSwingFarFront = state.isMoving ? Math.sin(legPhaseFarFront) * 0.6 : 0;
    const legSwingNearHind = state.isMoving ? Math.sin(legPhaseNearHind) * 0.6 : 0;
    const legSwingNearFront = state.isMoving ? Math.sin(legPhaseNearFront) * 0.6 : 0;

    const upperLegLen = 18;
    const lowerLegLen = 18;

    // =========================================================================
    // LAYER 1: FAR HORSE LEGS (Z = +5.0) -> Drawn BEHIND horse's solid body!
    // =========================================================================

    // Far-Back Leg (Hip at Z = +5.0)
    const farHindHipX = horseX - 18 * dir;
    const farHindHipY = horseY + 8;
    const farHindKneeX = farHindHipX + Math.sin(legSwingFarHind) * upperLegLen * dir;
    const farHindKneeY = farHindHipY + Math.cos(legSwingFarHind) * upperLegLen;
    const farHindHoofX = farHindKneeX + Math.sin(legSwingFarHind * 0.8) * lowerLegLen * dir;
    const farHindHoofY = farHindKneeY + Math.cos(legSwingFarHind * 0.8) * lowerLegLen;

    primitives.push({
      id: 'horse_far_hind_leg',
      depthZ: 5.0, // Behind horse body
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.8,
      points: [
        { x: farHindHipX, y: farHindHipY },
        { x: farHindKneeX, y: farHindKneeY },
        { x: farHindHoofX, y: farHindHoofY },
        { x: farHindHoofX + 5 * dir, y: farHindHoofY }, // Hoof
      ],
    });

    // Far-Front Leg (Shoulder at Z = +5.0)
    const farFrontShoulderX = horseX + 16 * dir;
    const farFrontShoulderY = horseY + 8;
    const farFrontKneeX = farFrontShoulderX + Math.sin(legSwingFarFront) * upperLegLen * dir;
    const farFrontKneeY = farFrontShoulderY + Math.cos(legSwingFarFront) * upperLegLen;
    const farFrontHoofX = farFrontKneeX + Math.sin(legSwingFarFront * 0.8) * lowerLegLen * dir;
    const farFrontHoofY = farFrontKneeY + Math.cos(legSwingFarFront * 0.8) * lowerLegLen;

    primitives.push({
      id: 'horse_far_front_leg',
      depthZ: 5.0, // Behind horse body
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

    // Tail (Behind body, single line oscillating)
    const tailWag = state.isMoving ? Math.sin(walkPhase * 2) * 8 : 0;
    primitives.push({
      id: 'horse_tail',
      depthZ: 4.5,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.5,
      points: [
        { x: horseX - 26 * dir, y: horseY + 6 },
        { x: horseX - 38 * dir, y: horseY + 12 + tailWag },
        { x: horseX - 44 * dir, y: horseY + 24 + tailWag },
      ],
    });

    // =========================================================================
    // LAYER 2: HORSE SOLID OPAQUE WHITE BODY & NECK (Z = 0)
    // Masks far limbs and background with 100% opaque white fill!
    // =========================================================================
    const barrelW = 54;
    const barrelH = 24;

    primitives.push({
      id: 'horse_body_neck',
      depthZ: 0,
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

        // 1. Horizontal solid rounded-rectangle / capsule body
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(horseX - (barrelW / 2) * dir, horseY - barrelH / 2 + 6, barrelW * dir, barrelH, 12);
        } else {
          ctx.ellipse(horseX, horseY + 6, 27, 12, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        // 2. Angled geometric neck with mane ticks
        const neckBaseX = horseX + 16 * dir;
        const neckBaseY = horseY + 4;
        const headX = horseX + 32 * dir;
        const headY = horseY - 32;

        ctx.save();
        ctx.translate(neckBaseX, neckBaseY);
        ctx.rotate(neckPitch * dir);

        // Neck solid polygon
        ctx.beginPath();
        ctx.moveTo(-6 * dir, 0);
        ctx.lineTo((headX - neckBaseX), (headY - neckBaseY) + 6);
        ctx.lineTo((headX - neckBaseX) + 8 * dir, (headY - neckBaseY));
        ctx.lineTo(8 * dir, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mane comb ticks along neck
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

        // 3. Horse Head: Solid white oval angled upwards
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
    // LAYER 4: NEAR HORSE LEGS (Z = -5.0) -> Drawn IN FRONT of horse body!
    // Shows shoulder and hip attachment starting slightly inside white body boundary
    // =========================================================================

    // Near-Back Leg (Hip at Z = -5.0)
    const nearHindHipX = horseX - 14 * dir;
    const nearHindHipY = horseY + 6;
    const nearHindKneeX = nearHindHipX + Math.sin(legSwingNearHind) * upperLegLen * dir;
    const nearHindKneeY = nearHindHipY + Math.cos(legSwingNearHind) * upperLegLen;
    const nearHindHoofX = nearHindKneeX + Math.sin(legSwingNearHind * 0.8) * lowerLegLen * dir;
    const nearHindHoofY = nearHindKneeY + Math.cos(legSwingNearHind * 0.8) * lowerLegLen;

    primitives.push({
      id: 'horse_near_hind_leg',
      depthZ: -5.0, // In front of horse body
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

    // Near-Front Leg (Shoulder at Z = -5.0)
    const nearFrontShoulderX = horseX + 18 * dir;
    const nearFrontShoulderY = horseY + 6;
    const nearFrontKneeX = nearFrontShoulderX + Math.sin(legSwingNearFront) * upperLegLen * dir;
    const nearFrontKneeY = nearFrontShoulderY + Math.cos(legSwingNearFront) * upperLegLen;
    const nearFrontHoofX = nearFrontKneeX + Math.sin(legSwingNearFront * 0.8) * lowerLegLen * dir;
    const nearFrontHoofY = nearFrontKneeY + Math.cos(legSwingNearFront * 0.8) * lowerLegLen;

    primitives.push({
      id: 'horse_near_front_leg',
      depthZ: -5.0, // In front of horse body
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

    return primitives;
  }
}

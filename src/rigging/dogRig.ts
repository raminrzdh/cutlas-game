import { SubPrimitive } from './types25d';

export interface DogRigState {
  x: number;
  y: number;
  facingDir: number;
  walkCycle: number;
  tailWag: number;
  isMoving: boolean;
  carryingBounty: number;
  timeSec: number;
}

export class Dog25DRig {
  public static generatePrimitives(state: DogRigState): SubPrimitive[] {
    const primitives: SubPrimitive[] = [];

    // 12 FPS discrete time quantization for snappy indie comic trot
    const trotPhase = Math.floor(state.walkCycle / (Math.PI / 4)) * (Math.PI / 4);
    const dir = state.facingDir;
    const dogX = state.x;
    const dogY = state.y;

    // Diagonal leg pairing:
    // Pair 1: Near-Front (Z = -3) + Far-Back (Z = +3) swing together
    // Pair 2: Far-Front (Z = +3) + Near-Back (Z = -3) swing together in opposite phase
    const swingPair1 = state.isMoving ? Math.sin(trotPhase * 1.5) * 0.65 : 0;
    const swingPair2 = state.isMoving ? -Math.sin(trotPhase * 1.5) * 0.65 : 0;

    const upperLegLen = 8;
    const lowerLegLen = 7;

    // =========================================================================
    // LAYER 1: FAR DOG LEGS (Z = +3.0) -> Drawn BEHIND solid white body
    // =========================================================================

    // Far-Back Leg (Pair 1)
    const farHindHipX = dogX - 7 * dir;
    const farHindHipY = dogY + 4;
    const farHindKneeX = farHindHipX + Math.sin(swingPair1) * upperLegLen * dir;
    const farHindKneeY = farHindHipY + Math.cos(swingPair1) * upperLegLen;
    const farHindPawX = farHindKneeX + Math.sin(swingPair1 * 0.8) * lowerLegLen * dir;
    const farHindPawY = farHindKneeY + Math.cos(swingPair1 * 0.8) * lowerLegLen;

    primitives.push({
      id: 'dog_far_hind_leg',
      depthZ: 3.0,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.0,
      points: [
        { x: farHindHipX, y: farHindHipY },
        { x: farHindKneeX, y: farHindKneeY },
        { x: farHindPawX, y: farHindPawY },
        { x: farHindPawX + 3 * dir, y: farHindPawY },
      ],
    });

    // Far-Front Leg (Pair 2)
    const farFrontShoulderX = dogX + 7 * dir;
    const farFrontShoulderY = dogY + 4;
    const farFrontKneeX = farFrontShoulderX + Math.sin(swingPair2) * upperLegLen * dir;
    const farFrontKneeY = farFrontShoulderY + Math.cos(swingPair2) * upperLegLen;
    const farFrontPawX = farFrontKneeX + Math.sin(swingPair2 * 0.8) * lowerLegLen * dir;
    const farFrontPawY = farFrontKneeY + Math.cos(swingPair2 * 0.8) * lowerLegLen;

    primitives.push({
      id: 'dog_far_front_leg',
      depthZ: 3.0,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.0,
      points: [
        { x: farFrontShoulderX, y: farFrontShoulderY },
        { x: farFrontKneeX, y: farFrontKneeY },
        { x: farFrontPawX, y: farFrontPawY },
        { x: farFrontPawX + 3 * dir, y: farFrontPawY },
      ],
    });

    // Dynamic single-line tail oscillating on Z and Y axes
    const tailOscY = Math.sin(state.tailWag) * 6;
    primitives.push({
      id: 'dog_tail',
      depthZ: 2.5,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.0,
      points: [
        { x: dogX - 11 * dir, y: dogY - 1 },
        { x: dogX - 18 * dir, y: dogY - 8 + tailOscY },
      ],
    });

    // =========================================================================
    // LAYER 2: SOLID OPAQUE WHITE DOG BODY & HEAD (Z = 0)
    // Masks upper segments of far legs
    // =========================================================================
    primitives.push({
      id: 'dog_body_head',
      depthZ: 0,
      type: 'solid_polygon',
      fillColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2.2,
      customDraw: (ctx) => {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Solid white oval body
        ctx.beginPath();
        ctx.ellipse(dogX, dogY, 11, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Red collar
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(dogX + 6 * dir, dogY - 3);
        ctx.lineTo(dogX + 6 * dir, dogY + 4);
        ctx.stroke();

        // Solid white head
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(dogX + 10 * dir, dogY - 5, 5.5, 4.5, -0.2 * dir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nose dot
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(dogX + 15 * dir, dogY - 5, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Floppy ear
        ctx.beginPath();
        ctx.moveTo(dogX + 8 * dir, dogY - 8);
        ctx.lineTo(dogX + 5 * dir, dogY - 2);
        ctx.stroke();

        // Bounty coin in mouth
        if (state.carryingBounty > 0) {
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(dogX + 18 * dir, dogY - 2, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ca8a04';
          ctx.font = 'bold 7px monospace';
          ctx.fillText('$', dogX + 16 * dir, dogY + 0.5);
        }

        ctx.restore();
      },
    });

    // =========================================================================
    // LAYER 3: NEAR DOG LEGS (Z = -3.0) -> Drawn IN FRONT of white body
    // =========================================================================

    // Near-Back Leg (Pair 2)
    const nearHindHipX = dogX - 6 * dir;
    const nearHindHipY = dogY + 3;
    const nearHindKneeX = nearHindHipX + Math.sin(swingPair2) * upperLegLen * dir;
    const nearHindKneeY = nearHindHipY + Math.cos(swingPair2) * upperLegLen;
    const nearHindPawX = nearHindKneeX + Math.sin(swingPair2 * 0.8) * lowerLegLen * dir;
    const nearHindPawY = nearHindKneeY + Math.cos(swingPair2 * 0.8) * lowerLegLen;

    primitives.push({
      id: 'dog_near_hind_leg',
      depthZ: -3.0,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.0,
      points: [
        { x: nearHindHipX, y: nearHindHipY },
        { x: nearHindKneeX, y: nearHindKneeY },
        { x: nearHindPawX, y: nearHindPawY },
        { x: nearHindPawX + 3 * dir, y: nearHindPawY },
      ],
    });

    // Near-Front Leg (Pair 1)
    const nearFrontShoulderX = dogX + 8 * dir;
    const nearFrontShoulderY = dogY + 3;
    const nearFrontKneeX = nearFrontShoulderX + Math.sin(swingPair1) * upperLegLen * dir;
    const nearFrontKneeY = nearFrontShoulderY + Math.cos(swingPair1) * upperLegLen;
    const nearFrontPawX = nearFrontKneeX + Math.sin(swingPair1 * 0.8) * lowerLegLen * dir;
    const nearFrontPawY = nearFrontKneeY + Math.cos(swingPair1 * 0.8) * lowerLegLen;

    primitives.push({
      id: 'dog_near_front_leg',
      depthZ: -3.0,
      type: 'stroke_polyline',
      strokeColor: '#000000',
      strokeWidth: 2.0,
      points: [
        { x: nearFrontShoulderX, y: nearFrontShoulderY },
        { x: nearFrontKneeX, y: nearFrontKneeY },
        { x: nearFrontPawX, y: nearFrontPawY },
        { x: nearFrontPawX + 3 * dir, y: nearFrontPawY },
      ],
    });

    return primitives;
  }
}

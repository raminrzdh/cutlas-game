/**
 * 2.5D Procedural Rigging & Sub-Object Painter's Algorithm Types
 * Inspired by Calpurnio's "Cuttlas Microfilms"
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export type SubPrimitiveType = 
  | 'solid_rect'
  | 'solid_polygon'
  | 'solid_ellipse'
  | 'solid_hat'
  | 'stroke_line'
  | 'stroke_polyline'
  | 'prop';

export interface SubPrimitive {
  id: string;
  depthZ: number; // Higher Z is rendered first (behind); lower Z rendered last (in front)
  type: SubPrimitiveType;
  fillColor?: string;
  strokeColor: string;
  strokeWidth: number;
  points?: Vec2[]; // For lines / polylines / polygons
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  rotation?: number;
  customDraw?: (ctx: CanvasRenderingContext2D) => void;
}

export type CharacterIdentity = 'cuttlas' | 'jim' | 'jak' | 'juan_bala' | 'alien_37' | 'bandit';

export interface HumanoidStyle {
  torsoFill: string;
  torsoStroke: string;
  headFill: string;
  headStroke: string;
  hatFill?: string;
  hatStroke?: string;
  limbStroke: string;
  hasHat: boolean;
  eyeLine: boolean;
}

export const CHARACTER_STYLES: Record<CharacterIdentity, HumanoidStyle> = {
  cuttlas: {
    torsoFill: '#FFFFFF',
    torsoStroke: '#000000',
    headFill: '#FFFFFF',
    headStroke: '#000000',
    hatFill: '#FFFFFF',
    hatStroke: '#000000',
    limbStroke: '#000000',
    hasHat: true,
    eyeLine: false, // Blank white oval head exactly as in attached image.png
  },
  jim: {
    torsoFill: '#FFFFFF',
    torsoStroke: '#000000',
    headFill: '#000000', // Jim's iconic solid black head
    headStroke: '#000000',
    hatFill: '#FFFFFF',
    hatStroke: '#000000',
    limbStroke: '#000000',
    hasHat: false,
    eyeLine: false,
  },
  jak: {
    torsoFill: '#7e22ce', // Jak the Bad's solid purple coat
    torsoStroke: '#000000',
    headFill: '#FFFFFF',
    headStroke: '#000000',
    hatFill: '#000000',
    hatStroke: '#000000',
    limbStroke: '#000000',
    hasHat: true,
    eyeLine: true,
  },
  juan_bala: {
    torsoFill: '#eab308', // Yellow poncho
    torsoStroke: '#000000',
    headFill: '#FFFFFF',
    headStroke: '#000000',
    hatFill: '#eab308',
    hatStroke: '#000000',
    limbStroke: '#000000',
    hasHat: true,
    eyeLine: true,
  },
  alien_37: {
    torsoFill: '#22c55e', // Solid green Alien 37
    torsoStroke: '#000000',
    headFill: '#22c55e',
    headStroke: '#000000',
    limbStroke: '#000000',
    hasHat: false,
    eyeLine: true,
  },
  bandit: {
    torsoFill: '#FFFFFF',
    torsoStroke: '#000000',
    headFill: '#FFFFFF',
    headStroke: '#000000',
    hatFill: '#1f2937',
    hatStroke: '#000000',
    limbStroke: '#000000',
    hasHat: true,
    eyeLine: true,
  },
};

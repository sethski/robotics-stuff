import type * as THREE from 'three';
import type { MaterialKey } from '../materials/palette';

export type { MaterialKey };

export type PinKind = 'digital' | 'pwm' | 'analog' | 'power' | 'ground';

export interface PinDef {
  id: string;
  kind: PinKind;
}

export interface SnapPoint {
  id: string;
  /** Only matching types may connect, e.g. 'wheel-shaft' to 'wheel-shaft'. */
  type: string;
  position: [number, number, number];
  normal: [number, number, number];
}

/** A drillable grid of mount holes on one face of a part. Metres. */
export interface MountSurface {
  id: string;
  origin: [number, number, number];
  normal: [number, number, number];
  /** Direction of increasing column index. Must be perpendicular to normal. */
  uAxis: [number, number, number];
  /** Hole pitch in metres. 0.00254 is standard 0.1 inch perfboard pitch. */
  pitch: number;
  cols: number;
  rows: number;
}

/** How many grid cells a part occupies when mounted. */
export interface Footprint {
  cols: number;
  rows: number;
}

export interface PartPiece {
  name: string;
  geometry: THREE.BufferGeometry;
  material: MaterialKey;
  /** Movable pieces (wheels) are excluded from static merging. */
  movable?: boolean;
}

/**
 * How much geometry a build should emit. Because parts are parametric,
 * a detail level is just another build input — there is no second asset.
 */
export type DetailLevel = 'high' | 'low';

export interface BuildContext {
  detail: DetailLevel;
  /** Radial segments for curves. 16 at high detail, 8 at low. */
  segments: number;
}

export interface PartDef<P extends object = object> {
  id: string;
  label: string;
  defaultParams: P;
  massKg: number;
  /** True only for programmable boards. Drives the Build-mode indicator. */
  codeable: boolean;
  footprint: Footprint;
  snaps: SnapPoint[];
  pins: PinDef[];
  surfaces?: MountSurface[];
  build(params: P, ctx: BuildContext): PartPiece[];
}

export interface BuiltPart {
  pieces: PartPiece[];
  triangleCount: number;
  drawCalls: number;
  detail: DetailLevel;
  cacheKey: string;
}

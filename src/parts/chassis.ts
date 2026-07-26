import * as THREE from 'three';
import type { MountSurface, PartDef, PartPiece } from './types';

export interface ChassisParams {
  length: number;
  width: number;
  thickness: number;
  pitch: number;
}

const DEFAULTS: ChassisParams = {
  length: 0.16,
  width: 0.10,
  thickness: 0.003,
  pitch: 0.00254,
};

/** Rounded rectangle as a Shape. Corner radius is fixed and modest. */
function plateShape(length: number, width: number): THREE.Shape {
  const halfL = length / 2;
  const halfW = width / 2;
  const r = Math.min(0.008, halfL, halfW);
  const shape = new THREE.Shape();
  shape.moveTo(-halfL + r, -halfW);
  shape.lineTo(halfL - r, -halfW);
  shape.quadraticCurveTo(halfL, -halfW, halfL, -halfW + r);
  shape.lineTo(halfL, halfW - r);
  shape.quadraticCurveTo(halfL, halfW, halfL - r, halfW);
  shape.lineTo(-halfL + r, halfW);
  shape.quadraticCurveTo(-halfL, halfW, -halfL, halfW - r);
  shape.lineTo(-halfL, -halfW + r);
  shape.quadraticCurveTo(-halfL, -halfW, -halfL + r, -halfW);
  return shape;
}

function mountGrid(params: ChassisParams): MountSurface {
  const cols = Math.floor((params.length * 0.85) / params.pitch);
  const rows = Math.floor((params.width * 0.85) / params.pitch);
  return {
    id: 'deck',
    origin: [-(cols - 1) * params.pitch / 2, -(rows - 1) * params.pitch / 2, params.thickness],
    normal: [0, 0, 1],
    uAxis: [1, 0, 0],
    pitch: params.pitch,
    cols,
    rows,
  };
}

export const chassis: PartDef<ChassisParams> = {
  id: 'chassis-2wd',
  label: '2WD Chassis Plate',
  defaultParams: DEFAULTS,
  massKg: 0.085,
  codeable: false,
  footprint: { cols: 0, rows: 0 },
  snaps: [
    { id: 'wheel-fl', type: 'wheel-shaft', position: [-0.07, 0.05, 0], normal: [0, 1, 0] },
    { id: 'wheel-fr', type: 'wheel-shaft', position: [0.07, 0.05, 0], normal: [0, 1, 0] },
    { id: 'wheel-rl', type: 'wheel-shaft', position: [-0.07, -0.05, 0], normal: [0, -1, 0] },
    { id: 'wheel-rr', type: 'wheel-shaft', position: [0.07, -0.05, 0], normal: [0, -1, 0] },
  ],
  pins: [],
  surfaces: [mountGrid(DEFAULTS)],
  build(params, ctx): PartPiece[] {
    const bevel = ctx.detail === 'high';
    const geometry = new THREE.ExtrudeGeometry(plateShape(params.length, params.width), {
      depth: params.thickness,
      bevelEnabled: bevel,
      bevelThickness: 0.0004,
      bevelSize: 0.0004,
      // Keep outer silhouette at param size; default bevel expands by bevelSize.
      bevelOffset: bevel ? -0.0004 : 0,
      bevelSegments: 1,
      curveSegments: bevel ? 4 : 1,
    });
    return [{ name: 'plate', geometry, material: 'plastic' }];
  },
};

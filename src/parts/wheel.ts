import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface WheelParams {
  radius: number;
  width: number;
  hubRadius: number;
}

export const wheel: PartDef<WheelParams> = {
  id: 'wheel-65',
  label: '65mm Wheel',
  defaultParams: { radius: 0.0325, width: 0.026, hubRadius: 0.010 },
  massKg: 0.033,
  codeable: false,
  footprint: { cols: 0, rows: 0 },
  snaps: [{ id: 'shaft', type: 'wheel-shaft', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [],
  build(params, ctx): PartPiece[] {
    const tyre = new THREE.CylinderGeometry(
      params.radius,
      params.radius,
      params.width,
      ctx.segments,
    );
    const pieces: PartPiece[] = [
      { name: 'tyre', geometry: tyre, material: 'rubber', movable: true },
    ];

    // The hub is cosmetic — at low detail it is inside the tyre silhouette anyway.
    if (ctx.detail === 'high') {
      const hub = new THREE.CylinderGeometry(
        params.hubRadius,
        params.hubRadius,
        params.width * 1.05,
        ctx.segments,
      );
      pieces.push({ name: 'hub', geometry: hub, material: 'plastic', movable: true });
    }

    return pieces;
  },
};

import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface MotorParams {
  bodyRadius: number;
  bodyLength: number;
  shaftRadius: number;
  shaftLength: number;
}

/**
 * Deck-mounted gearmotor. Mechanical shaft→wheel coupling stays on the chassis
 * wheel-shaft snaps for MVP; this part exists so Build can assign PWM pins.
 */
export const motor: PartDef<MotorParams> = {
  id: 'dc-motor',
  label: 'DC Gearmotor',
  defaultParams: {
    bodyRadius: 0.012,
    bodyLength: 0.025,
    shaftRadius: 0.0015,
    shaftLength: 0.01,
  },
  massKg: 0.04,
  codeable: false,
  footprint: { cols: 10, rows: 8 },
  snaps: [{ id: 'mount', type: 'deck-mount', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [
    { id: 'pwm', kind: 'pwm' },
    { id: 'vcc', kind: 'power' },
    { id: 'gnd', kind: 'ground' },
  ],
  build(params, ctx): PartPiece[] {
    const body = new THREE.CylinderGeometry(
      params.bodyRadius,
      params.bodyRadius,
      params.bodyLength,
      ctx.segments,
    );
    body.rotateZ(Math.PI / 2);
    body.translate(0, 0, params.bodyRadius);
    const pieces: PartPiece[] = [{ name: 'body', geometry: body, material: 'metal' }];

    if (ctx.detail === 'high') {
      const shaft = new THREE.CylinderGeometry(
        params.shaftRadius,
        params.shaftRadius,
        params.shaftLength,
        8,
      );
      shaft.rotateZ(Math.PI / 2);
      shaft.translate(params.bodyLength / 2 + params.shaftLength / 2, 0, params.bodyRadius);
      pieces.push({ name: 'shaft', geometry: shaft, material: 'gold' });
    }
    return pieces;
  },
};

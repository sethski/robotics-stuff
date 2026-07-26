import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface IrSensorParams {
  boardWidth: number;
  boardHeight: number;
  boardThickness: number;
}

export const irSensor: PartDef<IrSensorParams> = {
  id: 'ir-line-pair',
  label: 'IR Line Sensor Pair',
  defaultParams: {
    boardWidth: 0.04,
    boardHeight: 0.012,
    boardThickness: 0.0015,
  },
  massKg: 0.006,
  codeable: false,
  footprint: { cols: 16, rows: 5 },
  snaps: [{ id: 'mount', type: 'deck-mount', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [
    { id: 'left', kind: 'analog' },
    { id: 'right', kind: 'analog' },
    { id: 'vcc', kind: 'power' },
    { id: 'gnd', kind: 'ground' },
  ],
  build(params, ctx): PartPiece[] {
    const halfW = params.boardWidth / 2;
    const halfH = params.boardHeight / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, -halfH);
    shape.lineTo(halfW, -halfH);
    shape.lineTo(halfW, halfH);
    shape.lineTo(-halfW, halfH);
    shape.closePath();
    const board = new THREE.ExtrudeGeometry(shape, {
      depth: params.boardThickness,
      bevelEnabled: false,
    });
    const pieces: PartPiece[] = [{ name: 'board', geometry: board, material: 'pcb' }];
    for (const [i, x] of [-0.01, 0.01].entries()) {
      const eye = new THREE.BoxGeometry(0.005, 0.005, 0.004);
      eye.translate(x, 0, params.boardThickness + 0.002);
      pieces.push({ name: `eye-${i}`, geometry: eye, material: 'dark' });
      if (ctx.detail === 'high') {
        const led = new THREE.BoxGeometry(0.003, 0.003, 0.002);
        led.translate(x, 0.004, params.boardThickness + 0.001);
        pieces.push({ name: `led-${i}`, geometry: led, material: 'accent' });
      }
    }
    return pieces;
  },
};

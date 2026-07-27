import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface UltrasonicParams {
  boardWidth: number;
  boardHeight: number;
  boardThickness: number;
  transducerRadius: number;
  holeRadius: number;
}

function boardShape(params: UltrasonicParams): THREE.Shape {
  const halfW = params.boardWidth / 2;
  const halfH = params.boardHeight / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-halfW, -halfH);
  shape.lineTo(halfW, -halfH);
  shape.lineTo(halfW, halfH);
  shape.lineTo(-halfW, halfH);
  shape.closePath();

  for (const x of [-halfW * 0.82, halfW * 0.82]) {
    const hole = new THREE.Path();
    hole.absarc(x, 0, params.holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

export const ultrasonic: PartDef<UltrasonicParams> = {
  id: 'hc-sr04',
  label: 'Ultrasonic Distance Sensor',
  defaultParams: {
    boardWidth: 0.045,
    boardHeight: 0.020,
    boardThickness: 0.0015,
    transducerRadius: 0.008,
    holeRadius: 0.001,
  },
  massKg: 0.0085,
  codeable: false,
  footprint: { cols: 18, rows: 8 },
  snaps: [{ id: 'mount', type: 'deck-mount', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [
    { id: 'vcc', kind: 'power' },
    { id: 'trig', kind: 'digital' },
    { id: 'echo', kind: 'digital' },
    { id: 'gnd', kind: 'ground' },
  ],
  build(params, ctx): PartPiece[] {
    const board = new THREE.ExtrudeGeometry(boardShape(params), {
      depth: params.boardThickness,
      bevelEnabled: false,
      curveSegments: ctx.detail === 'high' ? 8 : 3,
    });

    const pieces: PartPiece[] = [{ name: 'board', geometry: board, material: 'pcb' }];

    for (const [index, x] of [-0.012, 0.012].entries()) {
      const can = new THREE.CylinderGeometry(
        params.transducerRadius,
        params.transducerRadius,
        0.0062,
        ctx.segments,
      );
      can.rotateX(Math.PI / 2);
      can.translate(x, 0, params.boardThickness + 0.0031);
      pieces.push({ name: `transducer-${index}`, geometry: can, material: 'metal' });

      // The grille disc is cosmetic — it reads as a flat face at low detail.
      if (ctx.detail === 'high') {
        const grille = new THREE.CircleGeometry(params.transducerRadius * 0.9, ctx.segments);
        grille.translate(x, 0, params.boardThickness + 0.0062);
        pieces.push({ name: `grille-${index}`, geometry: grille, material: 'mesh' });
      }
    }

    // The pin header is cosmetic at distance — millimetre detail on a 45mm board.
    if (ctx.detail === 'high') {
      const header = new THREE.BoxGeometry(0.0102, 0.0025, 0.0025);
      header.translate(0, -params.boardHeight / 2 + 0.0015, params.boardThickness + 0.001);
      pieces.push({ name: 'header', geometry: header, material: 'gold' });
    }

    return pieces;
  },
};

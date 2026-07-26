import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface UnoParams {
  boardWidth: number;
  boardHeight: number;
  boardThickness: number;
}

export const uno: PartDef<UnoParams> = {
  id: 'uno-r3',
  label: 'Arduino Uno R3',
  defaultParams: {
    boardWidth: 0.0686,
    boardHeight: 0.0533,
    boardThickness: 0.0016,
  },
  massKg: 0.025,
  codeable: true,
  // ~68.6×53.3mm at 2.54mm pitch
  footprint: { cols: 27, rows: 21 },
  snaps: [{ id: 'mount', type: 'deck-mount', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [],
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
      curveSegments: 1,
    });
    const pieces: PartPiece[] = [{ name: 'board', geometry: board, material: 'pcb' }];

    if (ctx.detail === 'high') {
      const usb = new THREE.BoxGeometry(0.012, 0.016, 0.006);
      usb.translate(-halfW + 0.006, 0, params.boardThickness + 0.003);
      pieces.push({ name: 'usb', geometry: usb, material: 'metal' });

      const mcu = new THREE.BoxGeometry(0.01, 0.01, 0.002);
      mcu.translate(0.005, 0, params.boardThickness + 0.001);
      pieces.push({ name: 'mcu', geometry: mcu, material: 'dark' });

      const header = new THREE.BoxGeometry(0.0025, 0.04, 0.008);
      header.translate(halfW - 0.004, 0, params.boardThickness + 0.004);
      pieces.push({ name: 'header', geometry: header, material: 'dark' });
    }

    return pieces;
  },
};

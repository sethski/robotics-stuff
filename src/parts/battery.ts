import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface BatteryParams {
  width: number;
  height: number;
  depth: number;
}

export const battery: PartDef<BatteryParams> = {
  id: 'battery-pack',
  label: 'AA Battery Pack',
  defaultParams: { width: 0.058, height: 0.032, depth: 0.015 },
  massKg: 0.1,
  codeable: false,
  footprint: { cols: 23, rows: 13 },
  snaps: [{ id: 'mount', type: 'deck-mount', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [],
  build(params): PartPiece[] {
    const box = new THREE.BoxGeometry(params.width, params.height, params.depth);
    box.translate(0, 0, params.depth / 2);
    return [{ name: 'pack', geometry: box, material: 'dark' }];
  },
};

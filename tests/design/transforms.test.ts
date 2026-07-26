import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../../src/design/createDesign';
import { placeOnSnap } from '../../src/design/placement';
import { worldPosition } from '../../src/design/transforms';

describe('transforms', () => {
  it('puts a snapped wheel at the chassis snap position', () => {
    const c = newInstanceId('c');
    const w = newInstanceId('w');
    let d = {
      ...createEmptyDesign(),
      parts: [
        { instanceId: c, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
        { instanceId: w, partId: 'wheel-65', params: {}, placement: null, pinMap: {} },
      ],
    };
    d = placeOnSnap(d, w, c, 'wheel-fl', 'shaft');
    const pos = worldPosition(d, w);
    expect(pos.distanceTo(new THREE.Vector3(-0.07, 0.05, 0))).toBeLessThan(1e-6);
  });
});

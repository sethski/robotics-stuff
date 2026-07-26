import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../../src/design/createDesign';
import { placeOnSnap } from '../../src/design/placement';
import { worldPosition, worldQuaternion } from '../../src/design/transforms';

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

  it('throws on placement cycles', () => {
    const a = newInstanceId('a');
    const b = newInstanceId('b');
    const d = {
      ...createEmptyDesign(),
      parts: [
        {
          instanceId: a,
          partId: 'wheel-65',
          params: {},
          placement: { kind: 'snap', hostInstanceId: b, hostSnapId: 'shaft', partSnapId: 'shaft' },
          pinMap: {},
        },
        {
          instanceId: b,
          partId: 'wheel-65',
          params: {},
          placement: { kind: 'snap', hostInstanceId: a, hostSnapId: 'shaft', partSnapId: 'shaft' },
          pinMap: {},
        },
      ],
    };
    expect(() => worldPosition(d, a)).toThrow(/cycle detected/i);
    expect(() => worldQuaternion(d, a)).toThrow(/cycle detected/i);
  });

  it('aligns a wheel shaft to a forward chassis snap normal', () => {
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
    const quat = worldQuaternion(d, w);
    const shaftAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    expect(shaftAxis.distanceTo(new THREE.Vector3(0, 1, 0))).toBeLessThan(1e-6);
  });

  it('aligns a wheel shaft to a rear chassis snap normal', () => {
    const c = newInstanceId('c');
    const w = newInstanceId('w');
    let d = {
      ...createEmptyDesign(),
      parts: [
        { instanceId: c, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
        { instanceId: w, partId: 'wheel-65', params: {}, placement: null, pinMap: {} },
      ],
    };
    d = placeOnSnap(d, w, c, 'wheel-rl', 'shaft');
    const quat = worldQuaternion(d, w);
    const shaftAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    expect(shaftAxis.distanceTo(new THREE.Vector3(0, -1, 0))).toBeLessThan(1e-6);
  });
});

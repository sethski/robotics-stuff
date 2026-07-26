import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../../src/design/createDesign';
import {
  canPlaceGrid,
  canPlaceSnap,
  placeOnGrid,
  placeOnSnap,
  occupiedCells,
} from '../../src/design/placement';
import type { PlacedPart, RobotDesign } from '../../src/design/types';

function designOf(parts: PlacedPart[]): RobotDesign {
  return { ...createEmptyDesign(), parts };
}

describe('placement', () => {
  it('snaps a wheel onto a free chassis shaft', () => {
    const chassisId = newInstanceId('c');
    const wheelId = newInstanceId('w');
    let d = designOf([
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
      { instanceId: wheelId, partId: 'wheel-65', params: {}, placement: null, pinMap: {} },
    ]);
    d = placeOnSnap(d, wheelId, chassisId, 'wheel-fl', 'shaft');
    const wheel = d.parts.find((p) => p.instanceId === wheelId)!;
    expect(wheel.placement).toEqual({
      kind: 'snap',
      hostInstanceId: chassisId,
      hostSnapId: 'wheel-fl',
      partSnapId: 'shaft',
    });
  });

  it('rejects overlapping grid footprints', () => {
    const chassisId = newInstanceId('c');
    const a = newInstanceId('a');
    const b = newInstanceId('b');
    let d = designOf([
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
      { instanceId: a, partId: 'hc-sr04', params: {}, placement: null, pinMap: {} },
      { instanceId: b, partId: 'hc-sr04', params: {}, placement: null, pinMap: {} },
    ]);
    d = placeOnGrid(d, a, chassisId, 'deck', 0, 0, 0);
    expect(canPlaceGrid(d, b, chassisId, 'deck', 0, 0, 0)).toBe(false);
    expect(canPlaceGrid(d, b, chassisId, 'deck', 20, 0, 0)).toBe(true);
  });

  it('tracks occupied cells for a placed sensor', () => {
    const chassisId = newInstanceId('c');
    const sensorId = newInstanceId('s');
    let d = designOf([
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
      { instanceId: sensorId, partId: 'hc-sr04', params: {}, placement: null, pinMap: {} },
    ]);
    d = placeOnGrid(d, sensorId, chassisId, 'deck', 2, 3, 0);
    const cells = occupiedCells(d, chassisId, 'deck');
    expect(cells.has('2,3')).toBe(true);
  });

  it('rejects wheel-to-wheel snap when host wheel is unplaced', () => {
    const chassisId = newInstanceId('c');
    const hostWheelId = newInstanceId('w1');
    const guestWheelId = newInstanceId('w2');
    const d = designOf([
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
      { instanceId: hostWheelId, partId: 'wheel-65', params: {}, placement: null, pinMap: {} },
      { instanceId: guestWheelId, partId: 'wheel-65', params: {}, placement: null, pinMap: {} },
    ]);
    expect(canPlaceSnap(d, guestWheelId, hostWheelId, 'shaft', 'shaft')).toBe(false);
  });

  it('uses rotated footprint for 90-degree grid occupancy', () => {
    const chassisId = newInstanceId('c');
    const sensorId = newInstanceId('s');
    const blockerId = newInstanceId('b');
    let d = designOf([
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
      { instanceId: sensorId, partId: 'hc-sr04', params: {}, placement: null, pinMap: {} },
      { instanceId: blockerId, partId: 'ir-line-pair', params: {}, placement: null, pinMap: {} },
    ]);
    d = placeOnGrid(d, sensorId, chassisId, 'deck', 0, 0, 1);
    expect(canPlaceGrid(d, blockerId, chassisId, 'deck', 0, 15, 0)).toBe(false);
    expect(canPlaceGrid(d, blockerId, chassisId, 'deck', 16, 0, 0)).toBe(true);
  });
});

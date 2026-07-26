import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../../src/design/createDesign';
import { canPlaceGrid, placeOnGrid, placeOnSnap, occupiedCells } from '../../src/design/placement';
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
});

/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyDesign, createStarterDesign, newInstanceId, syncInstanceIdCounter } from '../../src/design/createDesign';
import { loadDesign, mutateAndPersist, saveDesign, STORAGE_KEY } from '../../src/design/persist';
import { placeOnGrid } from '../../src/design/placement';
import type { PlacedPart } from '../../src/design/types';

beforeEach(() => {
  localStorage.clear();
});

describe('persist', () => {
  it('round-trips a design through localStorage', () => {
    const original = createStarterDesign();
    saveDesign(original);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loadDesign()?.parts).toHaveLength(original.parts.length);
  });

  it('returns null when empty', () => {
    expect(loadDesign()).toBeNull();
  });

  it('mutateAndPersist writes each mutation to localStorage', () => {
    const chassisId = newInstanceId('c');
    const batId = newInstanceId('b');
    const parts: PlacedPart[] = [
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
      { instanceId: batId, partId: 'battery-pack', params: {}, placement: null, pinMap: {} },
    ];
    let design = { ...createEmptyDesign(), parts };
    design = mutateAndPersist(design, (d) => placeOnGrid(d, batId, chassisId, 'deck', 10, 10, 0));
    const loaded = loadDesign();
    expect(loaded?.parts.find((p) => p.instanceId === batId)?.placement).toEqual({
      kind: 'grid',
      hostInstanceId: chassisId,
      surfaceId: 'deck',
      col: 10,
      row: 10,
      rotationSteps: 0,
    });
  });
});

describe('syncInstanceIdCounter', () => {
  it('bumps nextId past loaded instance ids', () => {
    const design = {
      ...createEmptyDesign(),
      parts: [{ instanceId: 'motor_zz', partId: 'dc-motor', params: {}, placement: null, pinMap: {} }],
    };
    syncInstanceIdCounter(design);
    const next = newInstanceId('motor');
    expect(next).not.toBe('motor_zz');
    const n = parseInt(next.split('_')[1], 36);
    expect(n).toBeGreaterThan(parseInt('zz', 36));
  });
});

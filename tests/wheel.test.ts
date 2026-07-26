import { describe, expect, it } from 'vitest';
import { wheel } from '../src/parts/wheel';
import { buildPart } from '../src/geometry/buildPart';

describe('wheel', () => {
  it('marks the rolling piece movable so it is not merged away', () => {
    const built = buildPart(wheel);
    expect(built.pieces.some((p) => p.movable)).toBe(true);
  });

  it('orients the tyre spin axis along part-local +Z', () => {
    const built = buildPart(wheel);
    const tyre = built.pieces.find((p) => p.name === 'tyre');
    expect(tyre).toBeDefined();
    tyre!.geometry.computeBoundingBox();
    const box = tyre!.geometry.boundingBox!;
    const extentX = box.max.x - box.min.x;
    const extentY = box.max.y - box.min.y;
    const extentZ = box.max.z - box.min.z;
    expect(extentZ).toBeLessThan(extentX);
    expect(extentX).toBeCloseTo(extentY, 3);
    expect(extentZ).toBeCloseTo(wheel.defaultParams.width, 4);
  });

  it('has a shaft snap that matches the chassis wheel mount type', () => {
    expect(wheel.snaps.map((s) => s.type)).toContain('wheel-shaft');
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(wheel).triangleCount).toBeLessThan(800);
  });

  it('builds at parameter extremes without throwing', () => {
    expect(() => buildPart(wheel, { radius: 0.02 })).not.toThrow();
    expect(() => buildPart(wheel, { radius: 0.06 })).not.toThrow();
  });

  it('drops the cosmetic hub at low detail', () => {
    const high = buildPart(wheel, undefined, 'high');
    const low = buildPart(wheel, undefined, 'low');
    expect(low.triangleCount).toBeLessThan(high.triangleCount);
  });
});

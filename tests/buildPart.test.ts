import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { buildPart, clearPartCache, partCacheSize } from '../src/geometry/buildPart';
import type { PartDef } from '../src/parts/types';

interface TestParams { size: number }

function makeDef(buildSpy = vi.fn()): PartDef<TestParams> {
  return {
    id: 'test-part',
    label: 'Test Part',
    defaultParams: { size: 1 },
    massKg: 0.1,
    codeable: false,
    footprint: { cols: 2, rows: 2 },
    snaps: [],
    pins: [],
    build(params, ctx) {
      buildSpy(params, ctx);
      const pieces = [
        { name: 'a', geometry: new THREE.BoxGeometry(params.size, 1, 1), material: 'dark' as const },
        { name: 'b', geometry: new THREE.BoxGeometry(params.size, 1, 1), material: 'dark' as const },
        { name: 'wheel', geometry: new THREE.BoxGeometry(1, 1, 1), material: 'rubber' as const, movable: true },
      ];
      // Cosmetic pieces are dropped at low detail.
      return ctx.detail === 'low' ? pieces.slice(1) : pieces;
    },
  };
}

describe('buildPart', () => {
  beforeEach(() => clearPartCache());

  it('merges static pieces sharing a material into one draw call and leaves movable pieces alone', () => {
    const built = buildPart(makeDef());
    // 'a' and 'b' merge into one dark piece; 'wheel' stays separate.
    expect(built.drawCalls).toBe(2);
    expect(built.pieces).toHaveLength(2);
    expect(built.pieces.filter((p) => p.movable)).toHaveLength(1);
  });

  it('counts triangles across all pieces', () => {
    const built = buildPart(makeDef());
    // Three boxes, 12 triangles each.
    expect(built.triangleCount).toBe(36);
  });

  it('builds once for identical params and reuses the cache', () => {
    const spy = vi.fn();
    const def = makeDef(spy);
    buildPart(def);
    buildPart(def);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(partCacheSize()).toBe(1);
  });

  it('rebuilds when params change', () => {
    const spy = vi.fn();
    const def = makeDef(spy);
    buildPart(def);
    buildPart(def, { size: 2 });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(partCacheSize()).toBe(2);
  });

  it('applies partial params over defaults', () => {
    const spy = vi.fn();
    buildPart(makeDef(spy), { size: 5 });
    expect(spy).toHaveBeenCalledWith({ size: 5 }, { detail: 'high', segments: 16 });
  });

  it('builds high detail by default and passes 16 segments', () => {
    const spy = vi.fn();
    buildPart(makeDef(spy));
    expect(spy).toHaveBeenCalledWith(expect.anything(), { detail: 'high', segments: 16 });
  });

  it('caches high and low detail separately', () => {
    const spy = vi.fn();
    const def = makeDef(spy);
    buildPart(def, undefined, 'high');
    buildPart(def, undefined, 'low');
    buildPart(def, undefined, 'low');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(partCacheSize()).toBe(2);
  });

  it('produces cheaper geometry at low detail', () => {
    const def = makeDef();
    const high = buildPart(def, undefined, 'high');
    const low = buildPart(def, undefined, 'low');
    expect(low.triangleCount).toBeLessThan(high.triangleCount);
    expect(low.drawCalls).toBeLessThanOrEqual(high.drawCalls);
    expect(low.detail).toBe('low');
  });
});

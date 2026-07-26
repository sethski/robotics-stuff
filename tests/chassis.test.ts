import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { chassis } from '../src/parts/chassis';
import { buildPart } from '../src/geometry/buildPart';

describe('chassis', () => {
  it('is not codeable', () => {
    expect(chassis.codeable).toBe(false);
  });

  it('builds a plate matching its parameter dimensions', () => {
    const built = buildPart(chassis);
    const box = new THREE.Box3();
    for (const piece of built.pieces) {
      piece.geometry.computeBoundingBox();
      box.union(piece.geometry.boundingBox!);
    }
    const size = box.getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(chassis.defaultParams.length, 3);
    expect(size.y).toBeCloseTo(chassis.defaultParams.width, 3);
  });

  it('exposes a mount surface on a real fabrication pitch', () => {
    const surface = chassis.surfaces?.[0];
    expect(surface).toBeDefined();
    expect(surface!.pitch).toBeCloseTo(0.00254, 5);
    expect(surface!.cols).toBeGreaterThan(1);
    expect(surface!.rows).toBeGreaterThan(1);
  });

  it('keeps the mount grid inside the plate', () => {
    const surface = chassis.surfaces![0];
    expect(surface.cols * surface.pitch).toBeLessThanOrEqual(chassis.defaultParams.length);
    expect(surface.rows * surface.pitch).toBeLessThanOrEqual(chassis.defaultParams.width);
  });

  it('provides four wheel mounts', () => {
    expect(chassis.snaps.filter((s) => s.type === 'wheel-shaft')).toHaveLength(4);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(chassis).triangleCount).toBeLessThan(600);
  });

  it('builds at parameter extremes without throwing', () => {
    expect(() => buildPart(chassis, { length: 0.08, width: 0.05 })).not.toThrow();
    expect(() => buildPart(chassis, { length: 0.30, width: 0.22 })).not.toThrow();
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPart } from '../src/geometry/buildPart';
import { chassis } from '../src/parts/chassis';
import { wheel } from '../src/parts/wheel';
import { ultrasonic } from '../src/parts/ultrasonic';

/** The reference robot from PRD §6: one chassis, two wheels, one ultrasonic. */
function referenceRobot() {
  const parts = [buildPart(chassis), buildPart(wheel), buildPart(wheel), buildPart(ultrasonic)];
  return {
    triangleCount: parts.reduce((sum, p) => sum + p.triangleCount, 0),
    drawCalls: parts.reduce((sum, p) => sum + p.drawCalls, 0),
  };
}

describe('performance budget', () => {
  it('keeps the reference robot under 15000 triangles', () => {
    expect(referenceRobot().triangleCount).toBeLessThan(15_000);
  });

  it('keeps the reference robot under 40 draw calls', () => {
    expect(referenceRobot().drawCalls).toBeLessThan(40);
  });
});

describe('zero asset bytes', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  it('does not depend on model loaders or CSG libraries', () => {
    for (const banned of ['three-bvh-csg', 'draco3d', 'meshoptimizer', '@google/model-viewer']) {
      expect(deps).not.toHaveProperty(banned);
    }
  });
});

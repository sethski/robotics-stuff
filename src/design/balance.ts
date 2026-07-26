import { getPart } from '../parts/registry';
import type { PlacedPart, RobotDesign } from './types';
import { worldPosition } from './transforms';

/** Parts visible in the scene: root chassis or anything with a placement. */
function isSceneVisible(part: PlacedPart): boolean {
  return part.placement !== null || part.partId === 'chassis-2wd';
}

export function centreOfMass(design: RobotDesign): {
  x: number;
  y: number;
  z: number;
  totalMassKg: number;
} {
  let mx = 0;
  let my = 0;
  let mz = 0;
  let m = 0;
  for (const part of design.parts) {
    if (!isSceneVisible(part)) continue;
    const mass = getPart(part.partId).massKg;
    const p = worldPosition(design, part.instanceId);
    mx += mass * p.x;
    my += mass * p.y;
    mz += mass * p.z;
    m += mass;
  }
  if (m === 0) return { x: 0, y: 0, z: 0, totalMassKg: 0 };
  return { x: mx / m, y: my / m, z: mz / m, totalMassKg: m };
}

/** 0 = centred, approaches 1 as COM drifts toward chassis half-extent. */
export function balanceScore(design: RobotDesign): number {
  const com = centreOfMass(design);
  const extent = 0.08;
  return Math.min(1, Math.hypot(com.x, com.y) / extent);
}

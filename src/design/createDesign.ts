import type { PlacedPart, RobotDesign } from './types';

let nextId = 1;
export function newInstanceId(prefix = 'p'): string {
  nextId += 1;
  return `${prefix}_${nextId.toString(36)}`;
}

/** Bump the instance-id counter so new IDs never collide with loaded designs. */
export function syncInstanceIdCounter(design: RobotDesign): void {
  let max = nextId;
  for (const part of design.parts) {
    const match = /^[a-z0-9-]+_([0-9a-z]+)$/i.exec(part.instanceId);
    if (!match) continue;
    const n = parseInt(match[1], 36);
    if (!Number.isNaN(n) && n >= max) max = n + 1;
  }
  nextId = max;
}

function placed(partId: string, extras: Partial<PlacedPart> = {}): PlacedPart {
  return {
    instanceId: newInstanceId(partId),
    partId,
    params: {},
    placement: null,
    pinMap: {},
    ...extras,
  };
}

export function createEmptyDesign(): RobotDesign {
  return { version: 1, parts: [], selectedInstanceId: null };
}

/**
 * PRD §6 BOM, unplaced. Placement + pin assignment happen in later tasks
 * via `placePart` / `autoAssignPins` so factories stay free of registry coupling.
 */
export function createStarterDesign(): RobotDesign {
  return {
    version: 1,
    selectedInstanceId: null,
    parts: [
      placed('chassis-2wd'),
      placed('uno-r3'),
      placed('dc-motor'),
      placed('dc-motor'),
      placed('wheel-65'),
      placed('wheel-65'),
      placed('ir-line-pair'),
      placed('hc-sr04'),
      placed('battery-pack'),
    ],
  };
}

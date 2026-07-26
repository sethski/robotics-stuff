import type { RobotDesign } from './types';

export const STORAGE_KEY = 'roboarena.design.v1';

export function saveDesign(design: RobotDesign): void {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
}

export function loadDesign(): RobotDesign | null {
  const raw = globalThis.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RobotDesign;
  } catch {
    return null;
  }
}

/** Apply a design mutation and persist the result. */
export function mutateAndPersist(
  design: RobotDesign,
  mutate: (d: RobotDesign) => RobotDesign,
): RobotDesign {
  const next = mutate(design);
  saveDesign(next);
  return next;
}

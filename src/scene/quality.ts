export type QualityTier = 'high' | 'medium' | 'low';

/** Minimum acceptable framerate from the PRD performance budget. */
export const FPS_FLOOR = 30;

const ORDER: QualityTier[] = ['high', 'medium', 'low'];

/**
 * Degrade one step when below the floor. Never upgrades automatically —
 * an upgrade would raise cost, drop the framerate, and oscillate.
 */
export function nextTier(current: QualityTier, fps: number): QualityTier {
  if (fps >= FPS_FLOOR) return current;
  const index = ORDER.indexOf(current);
  return ORDER[Math.min(index + 1, ORDER.length - 1)];
}

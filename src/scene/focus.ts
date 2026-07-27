import type { DetailLevel } from '../parts/types';

/**
 * Maps a part id and the currently focused part to a DetailLevel.
 *
 * This override is safe even though the global quality tier never auto-upgrades:
 * it is user-initiated (selection/focus), bounded to a single part at a time,
 * and is not driven by measured framerate, so it is not a feedback loop and
 * cannot oscillate.
 */
export function resolveDetail(partId: string, focusedId: string | null): DetailLevel {
  if (focusedId === partId) return 'high';
  return 'low';
}

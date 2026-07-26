import { createStarterDesign } from './createDesign';
import { placeOnGrid, placeOnSnap } from './placement';
import { autoAssignPins } from './pins';
import type { RobotDesign } from './types';

/** Places the starter BOM into a known-good layout and auto-assigns pins. */
export function seedPlacedStarter(): RobotDesign {
  let d = createStarterDesign();
  const byId = (partId: string, index = 0) =>
    d.parts.filter((p) => p.partId === partId)[index].instanceId;
  const chassisId = byId('chassis-2wd');
  // chassis stays null placement at origin
  d = placeOnSnap(d, byId('wheel-65', 0), chassisId, 'wheel-rl', 'shaft');
  d = placeOnSnap(d, byId('wheel-65', 1), chassisId, 'wheel-rr', 'shaft');
  d = placeOnGrid(d, byId('uno-r3'), chassisId, 'deck', 0, 0, 0);
  d = placeOnGrid(d, byId('dc-motor', 0), chassisId, 'deck', 27, 0, 0);
  d = placeOnGrid(d, byId('dc-motor', 1), chassisId, 'deck', 37, 0, 0);
  d = placeOnGrid(d, byId('ir-line-pair'), chassisId, 'deck', 27, 8, 0);
  d = placeOnGrid(d, byId('hc-sr04'), chassisId, 'deck', 0, 21, 0);
  d = placeOnGrid(d, byId('battery-pack'), chassisId, 'deck', 27, 13, 0);
  for (const p of d.parts) d = autoAssignPins(d, p.instanceId);
  return d;
}

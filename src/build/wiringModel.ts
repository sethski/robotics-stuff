import { UNO_PINS } from '../design/pins';
import type { BoardPinId, RobotDesign } from '../design/types';
import type { PinKind } from '../parts/types';

const SHAREABLE: ReadonlySet<BoardPinId> = new Set(['5V', 'GND']);

function isFree(design: RobotDesign, boardPin: BoardPinId, exceptInstanceId: string): boolean {
  if (SHAREABLE.has(boardPin)) return true;
  for (const part of design.parts) {
    if (part.instanceId === exceptInstanceId) continue;
    if (Object.values(part.pinMap).includes(boardPin)) return false;
  }
  return true;
}

/** Board pins that accept `kind` and are free for the given part instance. */
export function validBoardPinsFor(
  kind: PinKind,
  design: RobotDesign,
  instanceId: string,
): BoardPinId[] {
  return UNO_PINS.filter(
    (pin) => pin.kinds.includes(kind) && isFree(design, pin.id, instanceId),
  ).map((pin) => pin.id);
}

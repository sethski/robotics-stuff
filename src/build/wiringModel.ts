import { isBoardPinAvailable, UNO_PINS } from '../design/pins';
import type { BoardPinId, RobotDesign } from '../design/types';
import type { PinKind } from '../parts/types';

/** Board pins that accept `kind` and are free for the given part instance. */
export function validBoardPinsFor(
  kind: PinKind,
  design: RobotDesign,
  instanceId: string,
  exceptPartPinId?: string,
): BoardPinId[] {
  return UNO_PINS.filter(
    (pin) =>
      pin.kinds.includes(kind) &&
      isBoardPinAvailable(design, pin.id, instanceId, exceptPartPinId),
  ).map((pin) => pin.id);
}

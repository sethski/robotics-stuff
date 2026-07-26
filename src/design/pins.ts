import { getPart } from '../parts/registry';
import type { PinKind } from '../parts/types';
import type { BoardPinId, RobotDesign } from './types';

interface BoardPin {
  id: BoardPinId;
  kinds: PinKind[];
}

/** Arduino Uno R3 pool. Power/ground are shareable; signal pins are exclusive. */
export const UNO_PINS: BoardPin[] = [
  { id: 'D2', kinds: ['digital'] },
  { id: 'D3', kinds: ['digital', 'pwm'] },
  { id: 'D4', kinds: ['digital'] },
  { id: 'D5', kinds: ['digital', 'pwm'] },
  { id: 'D6', kinds: ['digital', 'pwm'] },
  { id: 'D7', kinds: ['digital'] },
  { id: 'D8', kinds: ['digital'] },
  { id: 'D9', kinds: ['digital', 'pwm'] },
  { id: 'D10', kinds: ['digital', 'pwm'] },
  { id: 'D11', kinds: ['digital', 'pwm'] },
  { id: 'D12', kinds: ['digital'] },
  { id: 'D13', kinds: ['digital'] },
  { id: 'A0', kinds: ['analog', 'digital'] },
  { id: 'A1', kinds: ['analog', 'digital'] },
  { id: 'A2', kinds: ['analog', 'digital'] },
  { id: 'A3', kinds: ['analog', 'digital'] },
  { id: 'A4', kinds: ['analog', 'digital'] },
  { id: 'A5', kinds: ['analog', 'digital'] },
  { id: '5V', kinds: ['power'] },
  { id: 'GND', kinds: ['ground'] },
];

const SHAREABLE: ReadonlySet<BoardPinId> = new Set(['5V', 'GND']);

export function usedBoardPins(design: RobotDesign): BoardPinId[] {
  const used: BoardPinId[] = [];
  for (const part of design.parts) {
    for (const boardPin of Object.values(part.pinMap)) used.push(boardPin);
  }
  return used;
}

export function isBoardPinAvailable(
  design: RobotDesign,
  boardPin: BoardPinId,
  exceptInstanceId?: string,
  exceptPartPinId?: string,
): boolean {
  if (SHAREABLE.has(boardPin)) return true;
  for (const part of design.parts) {
    for (const [partPinId, mapped] of Object.entries(part.pinMap)) {
      if (mapped !== boardPin) continue;
      if (part.instanceId === exceptInstanceId && partPinId === exceptPartPinId) continue;
      return false;
    }
  }
  return true;
}

function pickPin(design: RobotDesign, kind: PinKind, instanceId: string): BoardPinId | null {
  const candidate = UNO_PINS.find(
    (p) => p.kinds.includes(kind) && isBoardPinAvailable(design, p.id, instanceId),
  );
  return candidate?.id ?? null;
}

export function autoAssignPins(design: RobotDesign, instanceId: string): RobotDesign {
  const target = design.parts.find((p) => p.instanceId === instanceId);
  if (!target) return design;
  const def = getPart(target.partId);
  if (def.codeable || def.pins.length === 0) return design;

  const pinMap = { ...target.pinMap };
  let working = design;
  for (const pin of def.pins) {
    if (pinMap[pin.id]) continue;
    const chosen = pickPin(working, pin.kind, instanceId);
    if (!chosen) continue;
    pinMap[pin.id] = chosen;
    working = {
      ...working,
      parts: working.parts.map((p) =>
        p.instanceId === instanceId ? { ...p, pinMap: { ...pinMap } } : p,
      ),
    };
  }
  return working;
}

export function reassignPin(
  design: RobotDesign,
  instanceId: string,
  partPinId: string,
  boardPin: BoardPinId,
): RobotDesign {
  if (!isBoardPinAvailable(design, boardPin, instanceId, partPinId)) {
    throw new Error(`Board pin ${boardPin} is already in use`);
  }
  const target = design.parts.find((p) => p.instanceId === instanceId);
  if (!target) return design;
  const def = getPart(target.partId);
  const pinDef = def.pins.find((p) => p.id === partPinId);
  if (!pinDef) throw new Error(`Unknown part pin ${partPinId}`);
  const board = UNO_PINS.find((p) => p.id === boardPin);
  if (!board || !board.kinds.includes(pinDef.kind)) {
    throw new Error(`Board pin ${boardPin} cannot accept kind ${pinDef.kind}`);
  }
  return {
    ...design,
    parts: design.parts.map((p) =>
      p.instanceId === instanceId
        ? { ...p, pinMap: { ...p.pinMap, [partPinId]: boardPin } }
        : p,
    ),
  };
}

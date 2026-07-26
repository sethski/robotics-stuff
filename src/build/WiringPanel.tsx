import { useState } from 'react';
import { UNO_PINS } from '../design/pins';
import { getPart } from '../parts/registry';
import { useDesign } from '../state/DesignContext';
import type { BoardPinId } from '../design/types';
import { validBoardPinsFor } from './wiringModel';

export function WiringPanel() {
  const { design, reassignPin } = useDesign();
  const [pendingPartPin, setPendingPartPin] = useState<string | null>(null);

  const selectedId = design.selectedInstanceId;
  if (!selectedId) return null;

  const placed = design.parts.find((p) => p.instanceId === selectedId);
  if (!placed) return null;

  const def = getPart(placed.partId);
  if (def.pins.length === 0) return null;

  const pendingKind = pendingPartPin
    ? def.pins.find((p) => p.id === pendingPartPin)?.kind
    : undefined;
  const validBoard = pendingKind ? validBoardPinsFor(pendingKind, design, selectedId) : [];

  function onPartPinClick(pinId: string) {
    setPendingPartPin((prev) => (prev === pinId ? null : pinId));
  }

  function onBoardPinClick(boardPin: BoardPinId) {
    if (!pendingPartPin) return;
    if (!validBoard.includes(boardPin)) return;
    reassignPin(pendingPartPin, boardPin);
    setPendingPartPin(null);
  }

  return (
    <aside className="build-wiring" aria-label="Wiring panel">
      <h3>Wiring</h3>

      <div className="build-wiring-section">
        <h4>Part pins</h4>
        <div className="build-pin-grid">
          {def.pins.map((pin) => {
            const assigned = placed.pinMap[pin.id];
            const classes = ['build-pin'];
            if (assigned) classes.push('build-pin--assigned');
            if (pendingPartPin === pin.id) classes.push('build-pin--selected');
            return (
              <button
                key={pin.id}
                type="button"
                className={classes.join(' ')}
                onClick={() => onPartPinClick(pin.id)}
              >
                {pin.id}
                {assigned ? ` → ${assigned}` : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="build-wiring-section">
        <h4>Board pins</h4>
        <div className="build-pin-grid">
          {UNO_PINS.map((pin) => {
            const isValid = pendingPartPin !== null && validBoard.includes(pin.id);
            const classes = ['build-pin'];
            if (isValid) classes.push('build-pin--valid');
            else if (pendingPartPin) classes.push('build-pin--used');
            return (
              <button
                key={pin.id}
                type="button"
                className={classes.join(' ')}
                disabled={pendingPartPin !== null && !isValid}
                onClick={() => onBoardPinClick(pin.id)}
              >
                {pin.id}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

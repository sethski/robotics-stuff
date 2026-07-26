import { getPart } from '../parts/registry';
import { useDesign } from '../state/DesignContext';
import type { BoardPinId } from '../design/types';

export interface PinConstant {
  name: string;
  value: string;
}

function boardPinConstantValue(pin: BoardPinId): string | null {
  if (pin === '5V' || pin === 'GND') return null;
  if (pin.startsWith('D')) return pin.slice(1);
  if (pin.startsWith('A')) return String(14 + Number.parseInt(pin.slice(1), 10));
  return null;
}

export function derivePinConstants(design: { parts: Array<{ partId: string; pinMap: Record<string, BoardPinId> }> }): PinConstant[] {
  const out: PinConstant[] = [];
  const seen = new Set<string>();

  for (const part of design.parts) {
    const def = getPart(part.partId);
    for (const pinDef of def.pins) {
      const boardPin = part.pinMap[pinDef.id];
      if (!boardPin) continue;
      const value = boardPinConstantValue(boardPin);
      if (value === null) continue;
      const name = pinDef.id.toUpperCase();
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ name, value });
    }
  }

  return out;
}

export function CodeStub() {
  const { design } = useDesign();
  const constants = derivePinConstants(design);

  return (
    <section style={{ padding: '1.5rem', fontFamily: 'ui-monospace, monospace' }}>
      <p style={{ marginBottom: '1rem', fontFamily: 'system-ui, sans-serif', color: '#b8bcc4' }}>
        Editor and emulator arrive in the Code-mode plan.
      </p>
      {constants.length > 0 ? (
        <pre style={{ margin: 0, lineHeight: 1.6 }}>
          {constants.map(({ name, value }) => `const ${name} = ${value};\n`).join('')}
        </pre>
      ) : (
        <p style={{ color: '#8a8f98', fontFamily: 'system-ui, sans-serif' }}>
          Place parts and assign pins in Build to see pin constants here.
        </p>
      )}
    </section>
  );
}

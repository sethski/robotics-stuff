import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../../src/design/createDesign';
import { validBoardPinsFor } from '../../src/build/wiringModel';
import type { PlacedPart, RobotDesign } from '../../src/design/types';

function withParts(parts: PlacedPart[]): RobotDesign {
  return { ...createEmptyDesign(), parts };
}

describe('validBoardPinsFor', () => {
  it('returns digital pins not used by other parts', () => {
    const a = newInstanceId('a');
    const b = newInstanceId('b');
    const design = withParts([
      { instanceId: a, partId: 'hc-sr04', params: {}, placement: null, pinMap: { trig: 'D7' } },
      { instanceId: b, partId: 'hc-sr04', params: {}, placement: null, pinMap: {} },
    ]);
    const pins = validBoardPinsFor('digital', design, b);
    expect(pins).toContain('D2');
    expect(pins).not.toContain('D7');
  });

  it('returns pwm-capable pins for pwm kind', () => {
    const id = newInstanceId('s');
    const design = withParts([
      { instanceId: id, partId: 'hc-sr04', params: {}, placement: null, pinMap: {} },
    ]);
    const pins = validBoardPinsFor('pwm', design, id);
    expect(pins.every((p) => /^D(3|5|6|9|10|11)$/.test(p))).toBe(true);
  });

  it('always includes shareable 5V and GND for their kinds', () => {
    const a = newInstanceId('a');
    const b = newInstanceId('b');
    const design = withParts([
      { instanceId: a, partId: 'dc-motor', params: {}, placement: null, pinMap: { vcc: '5V', gnd: 'GND' } },
      { instanceId: b, partId: 'hc-sr04', params: {}, placement: null, pinMap: {} },
    ]);
    expect(validBoardPinsFor('power', design, b)).toContain('5V');
    expect(validBoardPinsFor('ground', design, b)).toContain('GND');
  });
});

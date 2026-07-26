import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../../src/design/createDesign';
import { autoAssignPins, reassignPin, usedBoardPins } from '../../src/design/pins';
import type { PlacedPart, RobotDesign } from '../../src/design/types';

function withParts(parts: PlacedPart[]): RobotDesign {
  return { ...createEmptyDesign(), parts };
}

describe('pin assignment', () => {
  it('assigns PWM-capable pins to motor pwm pins', () => {
    const motorId = newInstanceId('m');
    const unoId = newInstanceId('u');
    let design = withParts([
      { instanceId: unoId, partId: 'uno-r3', params: {}, placement: null, pinMap: {} },
      { instanceId: motorId, partId: 'dc-motor', params: {}, placement: null, pinMap: {} },
    ]);
    design = autoAssignPins(design, motorId);
    const motor = design.parts.find((p) => p.instanceId === motorId)!;
    expect(motor.pinMap.pwm).toMatch(/^D(3|5|6|9|10|11)$/);
    expect(motor.pinMap.vcc).toBe('5V');
    expect(motor.pinMap.gnd).toBe('GND');
  });

  it('does not reuse a board pin across parts', () => {
    const a = newInstanceId('a');
    const b = newInstanceId('b');
    const uno = newInstanceId('u');
    let design = withParts([
      { instanceId: uno, partId: 'uno-r3', params: {}, placement: null, pinMap: {} },
      { instanceId: a, partId: 'dc-motor', params: {}, placement: null, pinMap: {} },
      { instanceId: b, partId: 'dc-motor', params: {}, placement: null, pinMap: {} },
    ]);
    design = autoAssignPins(design, a);
    design = autoAssignPins(design, b);
    const used = usedBoardPins(design).filter((p) => p.startsWith('D'));
    expect(new Set(used).size).toBe(used.length);
  });

  it('reassignPin moves a mapping and frees the old pin', () => {
    const motorId = newInstanceId('m');
    const unoId = newInstanceId('u');
    let design = withParts([
      { instanceId: unoId, partId: 'uno-r3', params: {}, placement: null, pinMap: {} },
      { instanceId: motorId, partId: 'dc-motor', params: {}, placement: null, pinMap: { pwm: 'D3', vcc: '5V', gnd: 'GND' } },
    ]);
    design = reassignPin(design, motorId, 'pwm', 'D5');
    const motor = design.parts.find((p) => p.instanceId === motorId)!;
    expect(motor.pinMap.pwm).toBe('D5');
    expect(usedBoardPins(design)).toContain('D5');
    expect(usedBoardPins(design)).not.toContain('D3');
  });
});

import { describe, expect, it } from 'vitest';
import { buildPart } from '../src/geometry/buildPart';
import { motor } from '../src/parts/motor';

describe('dc motor', () => {
  it('needs a PWM pin plus power rails', () => {
    expect(motor.pins.map((p) => p.id).sort()).toEqual(['gnd', 'pwm', 'vcc']);
    expect(motor.pins.find((p) => p.id === 'pwm')?.kind).toBe('pwm');
  });

  it('has a deck footprint', () => {
    expect(motor.footprint.cols).toBeGreaterThan(0);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(motor).triangleCount).toBeLessThan(2000);
  });
});

import { describe, expect, it } from 'vitest';
import { seedPlacedStarter } from '../../src/design/seedPlacedStarter';

describe('seedPlacedStarter', () => {
  it('does not throw and places all BOM parts', () => {
    const d = seedPlacedStarter();
    expect(d.parts).toHaveLength(9);
    const unplaced = d.parts.filter((p) => p.placement === null);
    expect(unplaced).toHaveLength(1);
    expect(unplaced[0].partId).toBe('chassis-2wd');
  });

  it('assigns distinct PWM pins to both motors', () => {
    const d = seedPlacedStarter();
    const pwms = d.parts.filter((p) => p.partId === 'dc-motor').map((p) => p.pinMap.pwm);
    expect(pwms).toHaveLength(2);
    expect(pwms[0]).not.toBe(pwms[1]);
  });
});

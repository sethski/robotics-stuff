import { describe, expect, it } from 'vitest';
import { buildPart } from '../src/geometry/buildPart';
import { irSensor } from '../src/parts/irSensor';

describe('ir line sensor pair', () => {
  it('exposes left/right analog channels', () => {
    expect(irSensor.pins.filter((p) => p.kind === 'analog').map((p) => p.id).sort()).toEqual([
      'left',
      'right',
    ]);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(irSensor).triangleCount).toBeLessThan(2500);
  });
});

import { describe, expect, it } from 'vitest';
import { ultrasonic } from '../src/parts/ultrasonic';
import { buildPart } from '../src/geometry/buildPart';

describe('ultrasonic sensor', () => {
  it('declares the four HC-SR04 pins', () => {
    expect(ultrasonic.pins.map((p) => p.id)).toEqual(['vcc', 'trig', 'echo', 'gnd']);
  });

  it('needs two digital pins', () => {
    expect(ultrasonic.pins.filter((p) => p.kind === 'digital')).toHaveLength(2);
  });

  it('occupies a real footprint on the mount grid', () => {
    expect(ultrasonic.footprint.cols).toBeGreaterThan(0);
    expect(ultrasonic.footprint.rows).toBeGreaterThan(0);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(ultrasonic).triangleCount).toBeLessThan(3000);
  });

  it('builds at parameter extremes without throwing', () => {
    expect(() => buildPart(ultrasonic, { boardWidth: 0.030 })).not.toThrow();
    expect(() => buildPart(ultrasonic, { boardWidth: 0.060 })).not.toThrow();
  });

  it('is substantially cheaper at low detail', () => {
    const high = buildPart(ultrasonic, undefined, 'high');
    const low = buildPart(ultrasonic, undefined, 'low');
    expect(low.triangleCount).toBeLessThan(high.triangleCount * 0.6);
  });
});

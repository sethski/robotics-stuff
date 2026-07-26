import { describe, expect, it } from 'vitest';
import { buildPart } from '../src/geometry/buildPart';
import { battery } from '../src/parts/battery';

describe('battery pack', () => {
  it('has no signal pins', () => {
    expect(battery.pins).toEqual([]);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(battery).triangleCount).toBeLessThan(1500);
  });
});

import { describe, expect, it } from 'vitest';
import { buildPart } from '../src/geometry/buildPart';
import { uno } from '../src/parts/uno';

describe('arduino uno', () => {
  it('is the only codeable MVP part', () => {
    expect(uno.codeable).toBe(true);
    expect(uno.id).toBe('uno-r3');
  });

  it('occupies a deck footprint', () => {
    expect(uno.footprint.cols).toBeGreaterThan(0);
    expect(uno.footprint.rows).toBeGreaterThan(0);
  });

  it('does not consume pinMap slots (board is the pin pool)', () => {
    expect(uno.pins).toEqual([]);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(uno).triangleCount).toBeLessThan(4000);
  });

  it('is cheaper at low detail', () => {
    const high = buildPart(uno, undefined, 'high');
    const low = buildPart(uno, undefined, 'low');
    expect(low.triangleCount).toBeLessThan(high.triangleCount);
  });
});

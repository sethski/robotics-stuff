import { describe, expect, it } from 'vitest';
import { MATERIAL_KEYS, createPalette } from '../src/materials/palette';

describe('material palette', () => {
  it('creates exactly one material per key', () => {
    const palette = createPalette();
    expect(Object.keys(palette).sort()).toEqual([...MATERIAL_KEYS].sort());
  });

  it('keeps the palette small enough to batch well', () => {
    expect(MATERIAL_KEYS.length).toBeLessThanOrEqual(8);
  });

  it('returns the same material instance for repeated lookups', () => {
    const palette = createPalette();
    expect(palette.metal).toBe(palette.metal);
  });
});

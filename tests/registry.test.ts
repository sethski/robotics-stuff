import { describe, expect, it } from 'vitest';
import { PART_REGISTRY, getPart } from '../src/parts/registry';
import { buildPart } from '../src/geometry/buildPart';

describe('part registry', () => {
  it('contains all PRD §6 parts', () => {
    expect(Object.keys(PART_REGISTRY).sort()).toEqual(
      [
        'battery-pack',
        'chassis-2wd',
        'dc-motor',
        'hc-sr04',
        'ir-line-pair',
        'uno-r3',
        'wheel-65',
      ].sort(),
    );
  });

  it('keys every part by its own id', () => {
    for (const [id, def] of Object.entries(PART_REGISTRY)) {
      expect(def.id).toBe(id);
    }
  });

  it('throws a helpful error for an unknown id', () => {
    expect(() => getPart('nope')).toThrow('Unknown part id: nope');
  });

  it('builds every registered part with default params', () => {
    for (const def of Object.values(PART_REGISTRY)) {
      expect(() => buildPart(def)).not.toThrow();
    }
  });

  it('gives every part a positive mass', () => {
    for (const def of Object.values(PART_REGISTRY)) {
      expect(def.massKg).toBeGreaterThan(0);
    }
  });
});

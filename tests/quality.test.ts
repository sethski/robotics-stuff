import { describe, expect, it } from 'vitest';
import { nextTier } from '../src/scene/quality';

describe('quality tier', () => {
  it('drops from high to medium below the 30fps floor', () => {
    expect(nextTier('high', 24)).toBe('medium');
  });

  it('drops from medium to low when still below the floor', () => {
    expect(nextTier('medium', 22)).toBe('low');
  });

  it('never drops below low', () => {
    expect(nextTier('low', 5)).toBe('low');
  });

  it('holds the current tier when the framerate is healthy', () => {
    expect(nextTier('high', 60)).toBe('high');
    expect(nextTier('medium', 45)).toBe('medium');
  });

  it('does not automatically upgrade, to avoid oscillation', () => {
    expect(nextTier('low', 120)).toBe('low');
  });
});

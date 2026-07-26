import { describe, expect, it } from 'vitest';
import { resolveDetail } from '../src/scene/focus';

describe('resolveDetail', () => {
  it('resolves a focused part to high detail', () => {
    expect(resolveDetail('hc-sr04', 'hc-sr04')).toBe('high');
  });

  it('resolves an unfocused part to low detail', () => {
    expect(resolveDetail('hc-sr04', 'wheel-65')).toBe('low');
  });

  it('resolves every part to low when focus is null', () => {
    expect(resolveDetail('hc-sr04', null)).toBe('low');
    expect(resolveDetail('wheel-65', null)).toBe('low');
  });
});

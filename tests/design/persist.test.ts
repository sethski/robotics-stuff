/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createStarterDesign } from '../../src/design/createDesign';
import { loadDesign, saveDesign, STORAGE_KEY } from '../../src/design/persist';

beforeEach(() => {
  localStorage.clear();
});

describe('persist', () => {
  it('round-trips a design through localStorage', () => {
    const original = createStarterDesign();
    saveDesign(original);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loadDesign()?.parts).toHaveLength(original.parts.length);
  });

  it('returns null when empty', () => {
    expect(loadDesign()).toBeNull();
  });
});

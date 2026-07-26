import { describe, expect, it } from 'vitest';
import { createEmptyDesign, createStarterDesign } from '../../src/design/createDesign';

describe('createDesign', () => {
  it('starts empty with a version tag', () => {
    const d = createEmptyDesign();
    expect(d.version).toBe(1);
    expect(d.parts).toEqual([]);
    expect(d.selectedInstanceId).toBeNull();
  });

  it('starter design includes the PRD §6 bill of materials', () => {
    const ids = createStarterDesign().parts.map((p) => p.partId).sort();
    expect(ids).toEqual(
      ['battery-pack', 'chassis-2wd', 'dc-motor', 'dc-motor', 'hc-sr04', 'ir-line-pair', 'uno-r3', 'wheel-65', 'wheel-65'].sort(),
    );
  });

  it('gives every placed part a unique instanceId', () => {
    const parts = createStarterDesign().parts;
    expect(new Set(parts.map((p) => p.instanceId)).size).toBe(parts.length);
  });
});

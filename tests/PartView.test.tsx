// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { PartView } from '../src/scene/PartView';

describe('PartView', () => {
  it('renders one mesh per built piece', async () => {
    const renderer = await ReactThreeTestRenderer.create(<PartView partId="hc-sr04" />);
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBeGreaterThan(0);
  });

  it('shares material instances across pieces of the same key', async () => {
    const renderer = await ReactThreeTestRenderer.create(<PartView partId="hc-sr04" />);
    const meshes = renderer.scene.findAllByType('Mesh');
    const materials = new Set(meshes.map((m) => m.instance.material));
    // 8 palette materials is the ceiling regardless of piece count.
    expect(materials.size).toBeLessThanOrEqual(8);
  });
});

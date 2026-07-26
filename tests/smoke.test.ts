import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

describe('test harness', () => {
  it('can construct three.js geometry in node', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    expect(geometry.attributes.position.count).toBe(24);
  });
});

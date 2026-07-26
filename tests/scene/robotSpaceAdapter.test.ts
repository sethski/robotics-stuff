import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  ROBOT_RIDE_HEIGHT_M,
  ROBOT_SPACE_TO_WORLD_QUATERNION,
} from '../../src/scene/robotSpaceAdapter';
import { wheel } from '../../src/parts/wheel';

describe('robotSpaceAdapter', () => {
  it('maps part-space +Z onto world +Y', () => {
    const partUp = new THREE.Vector3(0, 0, 1).applyQuaternion(ROBOT_SPACE_TO_WORLD_QUATERNION);
    expect(partUp.distanceTo(new THREE.Vector3(0, 1, 0))).toBeLessThan(1e-6);
  });

  it('derives ride height from the default wheel radius', () => {
    expect(ROBOT_RIDE_HEIGHT_M).toBe(wheel.defaultParams.radius);
  });
});

import * as THREE from 'three';
import { wheel } from '../parts/wheel';

/**
 * Parts and robot design use Z-up (PRD §7.1a); three.js/drei scenes are Y-up.
 * This quaternion maps part-space +Z onto world +Y (rotation −π/2 about X).
 */
export const ROBOT_SPACE_TO_WORLD_QUATERNION = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);

/** Wheel radius sets ride height so tyre bottoms touch the Y=0 ground after the axis flip. */
export const ROBOT_RIDE_HEIGHT_M = wheel.defaultParams.radius;

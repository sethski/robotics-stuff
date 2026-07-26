// @vitest-environment jsdom
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../src/design/createDesign';
import { placeOnGrid } from '../src/design/placement';
import { getPart } from '../src/parts/registry';
import {
  gridCellFromWorldPoint,
  hostSnapWorldPosition,
} from '../src/scene/MountTargets';
import { isPartVisible, visibleParts } from '../src/scene/RobotView';

describe('RobotView helpers', () => {
  it('shows chassis at origin even when unplaced', () => {
    const chassisId = newInstanceId('c');
    const sensorId = newInstanceId('s');
    const design = {
      ...createEmptyDesign(),
      parts: [
        {
          instanceId: chassisId,
          partId: 'chassis-2wd',
          params: {},
          placement: null,
          pinMap: {},
        },
        {
          instanceId: sensorId,
          partId: 'hc-sr04',
          params: {},
          placement: null,
          pinMap: {},
        },
      ],
    };
    expect(isPartVisible(design.parts[0])).toBe(true);
    expect(isPartVisible(design.parts[1])).toBe(false);
    expect(visibleParts(design)).toHaveLength(1);
  });

  it('includes placed non-chassis parts', () => {
    const chassisId = newInstanceId('c');
    const sensorId = newInstanceId('s');
    let design = {
      ...createEmptyDesign(),
      parts: [
        {
          instanceId: chassisId,
          partId: 'chassis-2wd',
          params: {},
          placement: null,
          pinMap: {},
        },
        {
          instanceId: sensorId,
          partId: 'hc-sr04',
          params: {},
          placement: null,
          pinMap: {},
        },
      ],
    };
    design = placeOnGrid(design, sensorId, chassisId, 'deck', 2, 3, 0);
    expect(visibleParts(design)).toHaveLength(2);
  });
});

describe('MountTargets helpers', () => {
  it('maps a deck hit to the nearest grid cell', () => {
    const chassisId = newInstanceId('c');
    const sensorId = newInstanceId('s');
    const design = {
      ...createEmptyDesign(),
      selectedInstanceId: sensorId,
      parts: [
        {
          instanceId: chassisId,
          partId: 'chassis-2wd',
          params: {},
          placement: null,
          pinMap: {},
        },
        {
          instanceId: sensorId,
          partId: 'hc-sr04',
          params: {},
          placement: null,
          pinMap: {},
        },
      ],
    };
    const surface = getPart('chassis-2wd').surfaces![0];
    const hit = new THREE.Vector3(
      surface.origin[0] + 2 * surface.pitch,
      surface.origin[1] + 3 * surface.pitch,
      surface.origin[2],
    );
    const cell = gridCellFromWorldPoint(hit, design, chassisId, surface);
    expect(cell).toEqual({ col: 2, row: 3 });
  });

  it('places snap spheres at chassis shaft world positions', () => {
    const chassisId = newInstanceId('c');
    const wheelId = newInstanceId('w');
    const design = {
      ...createEmptyDesign(),
      selectedInstanceId: wheelId,
      parts: [
        {
          instanceId: chassisId,
          partId: 'chassis-2wd',
          params: {},
          placement: null,
          pinMap: {},
        },
        {
          instanceId: wheelId,
          partId: 'wheel-65',
          params: {},
          placement: null,
          pinMap: {},
        },
      ],
    };
    const pos = hostSnapWorldPosition(design, chassisId, 'wheel-fl');
    expect(pos.distanceTo(new THREE.Vector3(-0.07, 0.05, 0))).toBeLessThan(1e-6);
  });
});

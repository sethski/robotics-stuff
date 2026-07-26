import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId } from '../../src/design/createDesign';
import { placeOnSnap } from '../../src/design/placement';
import type { PlacedPart, RobotDesign } from '../../src/design/types';
import { assessRaceReadiness } from '../../src/shell/RaceStub';

function designOf(parts: PlacedPart[]): RobotDesign {
  return { ...createEmptyDesign(), parts };
}

describe('assessRaceReadiness', () => {
  it('counts the root chassis even when placement is null', () => {
    const chassisId = newInstanceId('c');
    const design = designOf([
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
    ]);

    expect(assessRaceReadiness(design)).toEqual({
      hasChassis: true,
      hasWheels: false,
      ready: false,
    });
  });

  it('is ready when the root chassis and a wheel are in the scene', () => {
    const chassisId = newInstanceId('c');
    const wheelId = newInstanceId('w');
    let design = designOf([
      { instanceId: chassisId, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} },
      { instanceId: wheelId, partId: 'wheel-65', params: {}, placement: null, pinMap: {} },
    ]);
    design = placeOnSnap(design, wheelId, chassisId, 'wheel-fl', 'shaft');

    expect(assessRaceReadiness(design)).toEqual({
      hasChassis: true,
      hasWheels: true,
      ready: true,
    });
  });
});

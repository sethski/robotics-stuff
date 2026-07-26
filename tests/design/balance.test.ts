import { describe, expect, it } from 'vitest';
import { createEmptyDesign, newInstanceId, syncInstanceIdCounter } from '../../src/design/createDesign';
import { balanceScore, centreOfMass } from '../../src/design/balance';
import { canPlaceGrid, placeOnGrid } from '../../src/design/placement';

describe('balance', () => {
  it('reports total mass of placed parts only', () => {
    const c = newInstanceId('c');
    const trayMotor = newInstanceId('m');
    const d = {
      ...createEmptyDesign(),
      parts: [
        {
          instanceId: c,
          partId: 'chassis-2wd',
          params: {},
          placement: null,
          pinMap: {},
        },
        {
          instanceId: trayMotor,
          partId: 'dc-motor',
          params: {},
          placement: null,
          pinMap: {},
        },
      ],
    };
    const com = centreOfMass(d);
    expect(com.totalMassKg).toBeCloseTo(0.085, 3);
  });

  it('worsens when a heavy pack sits far off-centre', () => {
    const c = newInstanceId('c');
    const bat = newInstanceId('b');
    const chassis = { instanceId: c, partId: 'chassis-2wd', params: {}, placement: null, pinMap: {} };
    const battery = { instanceId: bat, partId: 'battery-pack', params: {}, placement: null, pinMap: {} };

    // Battery footprint is 23×13; pick two valid deck cells with different COM offset.
    const nearCentreCol = 15;
    const nearCentreRow = 10;
    const cornerCol = 0;
    const cornerRow = 0;

    let centered = { ...createEmptyDesign(), parts: [chassis, battery] };
    expect(canPlaceGrid(centered, bat, c, 'deck', nearCentreCol, nearCentreRow, 0)).toBe(true);
    centered = placeOnGrid(centered, bat, c, 'deck', nearCentreCol, nearCentreRow, 0);
    const nearCentreScore = balanceScore(centered);

    let offset = { ...createEmptyDesign(), parts: [chassis, battery] };
    expect(canPlaceGrid(offset, bat, c, 'deck', cornerCol, cornerRow, 0)).toBe(true);
    offset = placeOnGrid(offset, bat, c, 'deck', cornerCol, cornerRow, 0);
    expect(balanceScore(offset)).toBeGreaterThan(nearCentreScore);
  });
});

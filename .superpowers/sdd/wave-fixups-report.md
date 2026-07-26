# Wave Fixups Report — Build Mode

**Branch:** `feat/wave-fixups`  
**Date:** 2026-07-26 (GMT+8)

## Critical fixes

### 1. Same-part pin exclusivity (`src/design/pins.ts`)
- `isBoardPinAvailable` now scans all `pinMap` entries across instances; same-instance pins count as taken except the `exceptPartPinId` being reassigned.
- `autoAssignPins` / `reassignPin` updated accordingly.
- **Tests:** `tests/design/pins.test.ts` — ultrasonic distinct digital pins, IR distinct analog pins, reassign collision on same part.

### 2. Snap cycles / unplaced hosts (`placement.ts`, `transforms.ts`)
- Added `isValidSnapHost`: only root chassis (`placement === null` && `chassis-2wd`) or placed parts may host snaps.
- `canPlaceSnap` / `listSnapTargets` reject unplaced siblings.
- `worldPosition` / `worldQuaternion` / `worldMatrix` detect cycles via visited set and throw a clear error.
- **Tests:** wheel→wheel snap rejected; placement cycle throws in `transforms.test.ts`.

## Important fixes

### 3. Auto-save (`DesignContext`, `persist.ts`)
- Added `mutateAndPersist`; all design mutations (add, place, nudge, rotate, reassign, autoAssign) persist via `saveDesign`.
- Explicit `save()` retained; `load` / `loadStarter` hydrate and persist.
- **Tests:** `mutateAndPersist` round-trip in `persist.test.ts`.

### 4. `rotationSteps` occupancy (`placement.ts`)
- `rotatedFootprint` swaps cols/rows for odd rotation steps; used in `occupiedCells` and `canPlaceGrid`.
- **Tests:** 90° rotated sensor blocks expected cells.

### 5. Balance ignores tray (`balance.ts`)
- `centreOfMass` / `balanceScore` only include root chassis or parts with `placement !== null`.
- **Tests:** tray motor excluded from mass total.

### 6. `nextId` after load (`createDesign.ts`)
- Exported `syncInstanceIdCounter(design)`; called on init, load, and loadStarter.
- **Tests:** counter bumps past loaded instance ids.

### 7. Keyboard placement (`BuildHud.tsx`)
- Added `SnapPlacementControls` — keyboard-activatable buttons for each `listSnapTargets` entry calling `placeSnap`.

## Verification

```
npm test   → 24 files, 91 tests passed
npm run build → success (tsc + vite)
```

## Out of scope (per instructions)
- Git history / timezone identity on old commits
- Seed → palette wiring
- Code/Race stub expansion

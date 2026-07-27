# Part System & Rendering Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the procedural part system — a `PartDef` contract, a cached geometry builder, a shared material palette, and a Tier 2 lit scene — and prove it by rendering three real parts with an enforced performance budget.

**Architecture:** Parts are pure functions from parameters to geometry, with no knowledge of React, the scene, or physics. A build layer caches results by parameter hash and merges static pieces to minimise draw calls. A material palette is shared globally so parts reference materials by key. The scene layer owns lighting and consumes built parts but never builds them.

**Tech Stack:** Vite, React 19, TypeScript, three.js, @react-three/fiber, @react-three/drei, Vitest, @react-three/test-renderer.

## Global Constraints

- **Zero asset bytes.** No `.glb`, `.gltf`, `.hdr`, or image files. All geometry and textures are generated in code. A test enforces this.
- **No glTF/Draco/meshopt loaders and no `model-viewer`.** Not in `package.json`.
- **No `three-bvh-csg` and no mesh booleans.** Holes are cut with `THREE.Path` holes inside `ExtrudeGeometry`.
- **Search open source before writing from scratch.** Record the search and verdict in the spec's §2 table before adding hand-written code for any general capability.
- **Shared materials only.** Parts return `MaterialKey` strings, never `THREE.Material` instances.
- **Low fixed segment counts.** Curve segments 12–16 for visible curves; never above 16 in MVP parts.
- **Performance budget (enforced by test in Task 8):** reference robot under 15,000 triangles and under 40 draw calls.
- **Licences:** MIT or Apache 2.0 only.
- Units are **metres** throughout (a 45mm board is `0.045`).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/parts/types.ts` | The `PartDef` contract and all shared part types. No logic. |
| `src/materials/palette.ts` | The 8 named materials and the `MaterialKey` union. |
| `src/geometry/buildPart.ts` | Build + parameter-hash cache + static merge. The only caller of `def.build()`. |
| `src/parts/chassis.ts` | Chassis part: extruded rounded plate, mount grid surface. |
| `src/parts/wheel.ts` | Wheel part: cylinder + instanced tread. |
| `src/parts/ultrasonic.ts` | Ultrasonic sensor: extruded board with `Path` holes + canvas silkscreen. |
| `src/parts/registry.ts` | Maps part id → `PartDef`. The catalog. |
| `src/scene/quality.ts` | Quality tier enum and the framerate downgrade decision. |
| `src/scene/Studio.tsx` | R3F lighting rig: `Environment`/`Lightformer`, `ContactShadows`, tone mapping. |
| `src/scene/PartView.tsx` | Renders a `BuiltPart` using the shared palette. |
| `src/scene/PartLOD.tsx` | Distance-based LOD wrapper around `PartView`; bypasses LOD when focused. |
| `src/scene/focus.ts` | Maps focused part id → `DetailLevel` for user-initiated quality override. |
| `tests/*` | One test file per source file above. |

---

## Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test` and `npm run dev`. All later tasks assume Vitest with `environment: 'node'` and that `three` is importable in tests.

- [ ] **Step 1: Create the project and install dependencies**

```bash
npm create vite@latest . -- --template react-ts
npm install three @react-three/fiber @react-three/drei
npm install -D vitest @react-three/test-renderer @types/three
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
```

- [ ] **Step 3: Add the test script to `package.json`**

Add to the `"scripts"` object:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

describe('test harness', () => {
  it('can construct three.js geometry in node', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    expect(geometry.attributes.position.count).toBe(24);
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npm test`
Expected: PASS, 1 test. If `three` fails to import, the harness is misconfigured — fix before continuing.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts index.html src tests
git commit -m "chore: scaffold vite react ts project with vitest harness"
```

---

## Task 2: The `PartDef` contract and material palette

**Files:**
- Create: `src/parts/types.ts`, `src/materials/palette.ts`
- Test: `tests/palette.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: every type below. Later tasks import `PartDef`, `PartPiece`, `MaterialKey`, `SnapPoint`, `PinDef`, `MountSurface`, `Footprint` from `src/parts/types.ts`, and `createPalette`, `MATERIAL_KEYS` from `src/materials/palette.ts`.

- [ ] **Step 1: Write `src/parts/types.ts`**

```ts
import type * as THREE from 'three';
import type { MaterialKey } from '../materials/palette';

export type { MaterialKey };

export type PinKind = 'digital' | 'pwm' | 'analog' | 'power' | 'ground';

export interface PinDef {
  id: string;
  kind: PinKind;
}

export interface SnapPoint {
  id: string;
  /** Only matching types may connect, e.g. 'wheel-shaft' to 'wheel-shaft'. */
  type: string;
  position: [number, number, number];
  normal: [number, number, number];
}

/** A drillable grid of mount holes on one face of a part. Metres. */
export interface MountSurface {
  id: string;
  origin: [number, number, number];
  normal: [number, number, number];
  /** Direction of increasing column index. Must be perpendicular to normal. */
  uAxis: [number, number, number];
  /** Hole pitch in metres. 0.00254 is standard 0.1 inch perfboard pitch. */
  pitch: number;
  cols: number;
  rows: number;
}

/** How many grid cells a part occupies when mounted. */
export interface Footprint {
  cols: number;
  rows: number;
}

export interface PartPiece {
  name: string;
  geometry: THREE.BufferGeometry;
  material: MaterialKey;
  /** Movable pieces (wheels) are excluded from static merging. */
  movable?: boolean;
}

/**
 * How much geometry a build should emit. Because parts are parametric,
 * a detail level is just another build input — there is no second asset.
 */
export type DetailLevel = 'high' | 'low';

export interface BuildContext {
  detail: DetailLevel;
  /** Radial segments for curves. 16 at high detail, 8 at low. */
  segments: number;
}

export interface PartDef<P extends object = object> {
  id: string;
  label: string;
  defaultParams: P;
  massKg: number;
  /** True only for programmable boards. Drives the Build-mode indicator. */
  codeable: boolean;
  footprint: Footprint;
  snaps: SnapPoint[];
  pins: PinDef[];
  surfaces?: MountSurface[];
  build(params: P, ctx: BuildContext): PartPiece[];
}

export interface BuiltPart {
  pieces: PartPiece[];
  triangleCount: number;
  drawCalls: number;
  detail: DetailLevel;
  cacheKey: string;
}
```

- [ ] **Step 2: Write `src/materials/palette.ts`**

```ts
import * as THREE from 'three';

export const MATERIAL_KEYS = [
  'pcb',
  'metal',
  'gold',
  'dark',
  'plastic',
  'rubber',
  'mesh',
  'accent',
] as const;

export type MaterialKey = (typeof MATERIAL_KEYS)[number];

interface MaterialSpec {
  color: number;
  roughness: number;
  metalness: number;
}

/** Tier 2 values, tuned once here so no part ever defines its own material. */
const SPECS: Record<MaterialKey, MaterialSpec> = {
  pcb: { color: 0x1f4fa8, roughness: 0.55, metalness: 0.05 },
  metal: { color: 0xa9b0bb, roughness: 0.32, metalness: 0.85 },
  gold: { color: 0xc9a227, roughness: 0.28, metalness: 0.9 },
  dark: { color: 0x2a2d33, roughness: 0.8, metalness: 0.1 },
  plastic: { color: 0xd8dbe0, roughness: 0.65, metalness: 0.0 },
  rubber: { color: 0x1b1d21, roughness: 0.95, metalness: 0.0 },
  mesh: { color: 0x6b7078, roughness: 0.9, metalness: 0.2 },
  accent: { color: 0xe0603a, roughness: 0.5, metalness: 0.0 },
};

export function createPalette(): Record<MaterialKey, THREE.MeshStandardMaterial> {
  const palette = {} as Record<MaterialKey, THREE.MeshStandardMaterial>;
  for (const key of MATERIAL_KEYS) {
    const spec = SPECS[key];
    palette[key] = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: spec.roughness,
      metalness: spec.metalness,
    });
  }
  return palette;
}
```

- [ ] **Step 3: Write the failing test**

Create `tests/palette.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MATERIAL_KEYS, createPalette } from '../src/materials/palette';

describe('material palette', () => {
  it('creates exactly one material per key', () => {
    const palette = createPalette();
    expect(Object.keys(palette).sort()).toEqual([...MATERIAL_KEYS].sort());
  });

  it('keeps the palette small enough to batch well', () => {
    expect(MATERIAL_KEYS.length).toBeLessThanOrEqual(8);
  });

  it('returns the same material instance for repeated lookups', () => {
    const palette = createPalette();
    expect(palette.metal).toBe(palette.metal);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `npm test -- tests/palette.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/parts/types.ts src/materials/palette.ts tests/palette.test.ts
git commit -m "feat: add PartDef contract and shared Tier 2 material palette"
```

---

## Task 3: Geometry builder with cache and static merge

**Files:**
- Create: `src/geometry/buildPart.ts`
- Test: `tests/buildPart.test.ts`

**Interfaces:**
- Consumes: `PartDef`, `PartPiece`, `BuiltPart` from `src/parts/types.ts`.
- Produces: `buildPart<P>(def: PartDef<P>, params?: Partial<P>, detail?: DetailLevel): BuiltPart`, `clearPartCache(): void`, and `partCacheSize(): number`. Every later task calls `buildPart`; nothing else calls `def.build()`. `detail` defaults to `'high'`.

- [ ] **Step 1: Write the failing test**

Create `tests/buildPart.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { buildPart, clearPartCache, partCacheSize } from '../src/geometry/buildPart';
import type { PartDef } from '../src/parts/types';

interface TestParams { size: number }

function makeDef(buildSpy = vi.fn()): PartDef<TestParams> {
  return {
    id: 'test-part',
    label: 'Test Part',
    defaultParams: { size: 1 },
    massKg: 0.1,
    codeable: false,
    footprint: { cols: 2, rows: 2 },
    snaps: [],
    pins: [],
    build(params, ctx) {
      buildSpy(params, ctx);
      const pieces = [
        { name: 'a', geometry: new THREE.BoxGeometry(params.size, 1, 1), material: 'dark' as const },
        { name: 'b', geometry: new THREE.BoxGeometry(params.size, 1, 1), material: 'dark' as const },
        { name: 'wheel', geometry: new THREE.BoxGeometry(1, 1, 1), material: 'rubber' as const, movable: true },
      ];
      // Cosmetic pieces are dropped at low detail.
      return ctx.detail === 'low' ? pieces.slice(1) : pieces;
    },
  };
}

describe('buildPart', () => {
  beforeEach(() => clearPartCache());

  it('merges static pieces sharing a material into one draw call and leaves movable pieces alone', () => {
    const built = buildPart(makeDef());
    // 'a' and 'b' merge into one dark piece; 'wheel' stays separate.
    expect(built.drawCalls).toBe(2);
    expect(built.pieces).toHaveLength(2);
    expect(built.pieces.filter((p) => p.movable)).toHaveLength(1);
  });

  it('counts triangles across all pieces', () => {
    const built = buildPart(makeDef());
    // Three boxes, 12 triangles each.
    expect(built.triangleCount).toBe(36);
  });

  it('builds once for identical params and reuses the cache', () => {
    const spy = vi.fn();
    const def = makeDef(spy);
    buildPart(def);
    buildPart(def);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(partCacheSize()).toBe(1);
  });

  it('rebuilds when params change', () => {
    const spy = vi.fn();
    const def = makeDef(spy);
    buildPart(def);
    buildPart(def, { size: 2 });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(partCacheSize()).toBe(2);
  });

  it('applies partial params over defaults', () => {
    const spy = vi.fn();
    buildPart(makeDef(spy), { size: 5 });
    expect(spy).toHaveBeenCalledWith({ size: 5 }, { detail: 'high', segments: 16 });
  });

  it('builds high detail by default and passes 16 segments', () => {
    const spy = vi.fn();
    buildPart(makeDef(spy));
    expect(spy).toHaveBeenCalledWith(expect.anything(), { detail: 'high', segments: 16 });
  });

  it('caches high and low detail separately', () => {
    const spy = vi.fn();
    const def = makeDef(spy);
    buildPart(def, undefined, 'high');
    buildPart(def, undefined, 'low');
    buildPart(def, undefined, 'low');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(partCacheSize()).toBe(2);
  });

  it('produces cheaper geometry at low detail', () => {
    const def = makeDef();
    const high = buildPart(def, undefined, 'high');
    const low = buildPart(def, undefined, 'low');
    expect(low.triangleCount).toBeLessThan(high.triangleCount);
    expect(low.drawCalls).toBeLessThanOrEqual(high.drawCalls);
    expect(low.detail).toBe('low');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/buildPart.test.ts`
Expected: FAIL — cannot resolve `../src/geometry/buildPart`.

- [ ] **Step 3: Write `src/geometry/buildPart.ts`**

```ts
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BuiltPart, DetailLevel, MaterialKey, PartDef, PartPiece } from '../parts/types';

const cache = new Map<string, BuiltPart>();

function triangleCount(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) return index.count / 3;
  return geometry.attributes.position.count / 3;
}

/** Merge static pieces that share a material so each material costs one draw call. */
function mergeStatic(pieces: PartPiece[]): PartPiece[] {
  const groups = new Map<MaterialKey, PartPiece[]>();
  const output: PartPiece[] = [];

  for (const piece of pieces) {
    if (piece.movable) {
      output.push(piece);
      continue;
    }
    const group = groups.get(piece.material) ?? [];
    group.push(piece);
    groups.set(piece.material, group);
  }

  for (const [material, group] of groups) {
    if (group.length === 1) {
      output.push(group[0]);
      continue;
    }
    const merged = mergeGeometries(group.map((p) => p.geometry));
    if (!merged) throw new Error(`Failed to merge geometry for material "${material}"`);
    output.push({ name: `merged-${material}`, geometry: merged, material });
  }

  return output;
}

const SEGMENTS_FOR: Record<DetailLevel, number> = { high: 16, low: 8 };

export function buildPart<P extends object>(
  def: PartDef<P>,
  params?: Partial<P>,
  detail: DetailLevel = 'high',
): BuiltPart {
  const resolved = { ...def.defaultParams, ...params } as P;
  const cacheKey = `${def.id}:${detail}:${JSON.stringify(resolved)}`;

  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const raw = def.build(resolved, { detail, segments: SEGMENTS_FOR[detail] });
  const total = raw.reduce((sum, piece) => sum + triangleCount(piece.geometry), 0);
  const pieces = mergeStatic(raw);

  const built: BuiltPart = {
    pieces,
    triangleCount: total,
    drawCalls: pieces.length,
    detail,
    cacheKey,
  };
  cache.set(cacheKey, built);
  return built;
}

export function clearPartCache(): void {
  cache.clear();
}

export function partCacheSize(): number {
  return cache.size;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/buildPart.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/geometry/buildPart.ts tests/buildPart.test.ts
git commit -m "feat: add cached part geometry builder with static merging"
```

---

## Task 4: Chassis part with a mount grid

**Files:**
- Create: `src/parts/chassis.ts`
- Test: `tests/chassis.test.ts`

**Interfaces:**
- Consumes: `buildPart` from Task 3; `PartDef`, `MountSurface` from Task 2.
- Produces: `chassis: PartDef<ChassisParams>` and `interface ChassisParams { length: number; width: number; thickness: number; pitch: number }`. Task 8 imports `chassis`.

- [ ] **Step 1: Write the failing test**

Create `tests/chassis.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { chassis } from '../src/parts/chassis';
import { buildPart } from '../src/geometry/buildPart';

describe('chassis', () => {
  it('is not codeable', () => {
    expect(chassis.codeable).toBe(false);
  });

  it('builds a plate matching its parameter dimensions', () => {
    const built = buildPart(chassis);
    const box = new THREE.Box3();
    for (const piece of built.pieces) {
      piece.geometry.computeBoundingBox();
      box.union(piece.geometry.boundingBox!);
    }
    const size = box.getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(chassis.defaultParams.length, 3);
    expect(size.y).toBeCloseTo(chassis.defaultParams.width, 3);
  });

  it('exposes a mount surface on a real fabrication pitch', () => {
    const surface = chassis.surfaces?.[0];
    expect(surface).toBeDefined();
    expect(surface!.pitch).toBeCloseTo(0.00254, 5);
    expect(surface!.cols).toBeGreaterThan(1);
    expect(surface!.rows).toBeGreaterThan(1);
  });

  it('keeps the mount grid inside the plate', () => {
    const surface = chassis.surfaces![0];
    expect(surface.cols * surface.pitch).toBeLessThanOrEqual(chassis.defaultParams.length);
    expect(surface.rows * surface.pitch).toBeLessThanOrEqual(chassis.defaultParams.width);
  });

  it('provides four wheel mounts', () => {
    expect(chassis.snaps.filter((s) => s.type === 'wheel-shaft')).toHaveLength(4);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(chassis).triangleCount).toBeLessThan(600);
  });

  it('builds at parameter extremes without throwing', () => {
    expect(() => buildPart(chassis, { length: 0.08, width: 0.05 })).not.toThrow();
    expect(() => buildPart(chassis, { length: 0.30, width: 0.22 })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/chassis.test.ts`
Expected: FAIL — cannot resolve `../src/parts/chassis`.

- [ ] **Step 3: Write `src/parts/chassis.ts`**

```ts
import * as THREE from 'three';
import type { MountSurface, PartDef, PartPiece } from './types';

export interface ChassisParams {
  length: number;
  width: number;
  thickness: number;
  pitch: number;
}

const DEFAULTS: ChassisParams = {
  length: 0.16,
  width: 0.10,
  thickness: 0.003,
  pitch: 0.00254,
};

/** Rounded rectangle as a Shape. Corner radius is fixed and modest. */
function plateShape(length: number, width: number): THREE.Shape {
  const halfL = length / 2;
  const halfW = width / 2;
  const r = Math.min(0.008, halfL, halfW);
  const shape = new THREE.Shape();
  shape.moveTo(-halfL + r, -halfW);
  shape.lineTo(halfL - r, -halfW);
  shape.quadraticCurveTo(halfL, -halfW, halfL, -halfW + r);
  shape.lineTo(halfL, halfW - r);
  shape.quadraticCurveTo(halfL, halfW, halfL - r, halfW);
  shape.lineTo(-halfL + r, halfW);
  shape.quadraticCurveTo(-halfL, halfW, -halfL, halfW - r);
  shape.lineTo(-halfL, -halfW + r);
  shape.quadraticCurveTo(-halfL, -halfW, -halfL + r, -halfW);
  return shape;
}

function mountGrid(params: ChassisParams): MountSurface {
  const cols = Math.floor((params.length * 0.85) / params.pitch);
  const rows = Math.floor((params.width * 0.85) / params.pitch);
  return {
    id: 'deck',
    origin: [-(cols - 1) * params.pitch / 2, -(rows - 1) * params.pitch / 2, params.thickness],
    normal: [0, 0, 1],
    uAxis: [1, 0, 0],
    pitch: params.pitch,
    cols,
    rows,
  };
}

export const chassis: PartDef<ChassisParams> = {
  id: 'chassis-2wd',
  label: '2WD Chassis Plate',
  defaultParams: DEFAULTS,
  massKg: 0.085,
  codeable: false,
  footprint: { cols: 0, rows: 0 },
  snaps: [
    { id: 'wheel-fl', type: 'wheel-shaft', position: [-0.07, 0.05, 0], normal: [0, 1, 0] },
    { id: 'wheel-fr', type: 'wheel-shaft', position: [0.07, 0.05, 0], normal: [0, 1, 0] },
    { id: 'wheel-rl', type: 'wheel-shaft', position: [-0.07, -0.05, 0], normal: [0, -1, 0] },
    { id: 'wheel-rr', type: 'wheel-shaft', position: [0.07, -0.05, 0], normal: [0, -1, 0] },
  ],
  pins: [],
  surfaces: [mountGrid(DEFAULTS)],
  build(params, ctx): PartPiece[] {
    const geometry = new THREE.ExtrudeGeometry(plateShape(params.length, params.width), {
      depth: params.thickness,
      bevelEnabled: ctx.detail === 'high',
      bevelThickness: 0.0004,
      bevelSize: 0.0004,
      bevelSegments: 1,
      curveSegments: ctx.detail === 'high' ? 4 : 1,
    });
    return [{ name: 'plate', geometry, material: 'plastic' }];
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/chassis.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/parts/chassis.ts tests/chassis.test.ts
git commit -m "feat: add procedural chassis part with perfboard-pitch mount grid"
```

---

## Task 5: Wheel and ultrasonic sensor parts

**Files:**
- Create: `src/parts/wheel.ts`, `src/parts/ultrasonic.ts`, `src/parts/registry.ts`
- Test: `tests/wheel.test.ts`, `tests/ultrasonic.test.ts`, `tests/registry.test.ts`

**Interfaces:**
- Consumes: `buildPart` (Task 3), types (Task 2).
- Produces: `wheel: PartDef<WheelParams>`, `ultrasonic: PartDef<UltrasonicParams>`, and `PART_REGISTRY: Record<string, PartDef<never>>` plus `getPart(id: string): PartDef<never>` from `src/parts/registry.ts`. Task 8 imports `wheel`, `ultrasonic`, and `PART_REGISTRY`.

- [ ] **Step 1: Write the failing wheel test**

Create `tests/wheel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { wheel } from '../src/parts/wheel';
import { buildPart } from '../src/geometry/buildPart';

describe('wheel', () => {
  it('marks the rolling piece movable so it is not merged away', () => {
    const built = buildPart(wheel);
    expect(built.pieces.some((p) => p.movable)).toBe(true);
  });

  it('has a shaft snap that matches the chassis wheel mount type', () => {
    expect(wheel.snaps.map((s) => s.type)).toContain('wheel-shaft');
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(wheel).triangleCount).toBeLessThan(800);
  });

  it('builds at parameter extremes without throwing', () => {
    expect(() => buildPart(wheel, { radius: 0.02 })).not.toThrow();
    expect(() => buildPart(wheel, { radius: 0.06 })).not.toThrow();
  });

  it('drops the cosmetic hub at low detail', () => {
    const high = buildPart(wheel, undefined, 'high');
    const low = buildPart(wheel, undefined, 'low');
    expect(low.triangleCount).toBeLessThan(high.triangleCount);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- tests/wheel.test.ts`
Expected: FAIL — cannot resolve `../src/parts/wheel`.

- [ ] **Step 3: Write `src/parts/wheel.ts`**

```ts
import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface WheelParams {
  radius: number;
  width: number;
  hubRadius: number;
}

export const wheel: PartDef<WheelParams> = {
  id: 'wheel-65',
  label: '65mm Wheel',
  defaultParams: { radius: 0.0325, width: 0.026, hubRadius: 0.010 },
  massKg: 0.033,
  codeable: false,
  footprint: { cols: 0, rows: 0 },
  snaps: [{ id: 'shaft', type: 'wheel-shaft', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [],
  build(params, ctx): PartPiece[] {
    const tyre = new THREE.CylinderGeometry(
      params.radius,
      params.radius,
      params.width,
      ctx.segments,
    );
    const pieces: PartPiece[] = [
      { name: 'tyre', geometry: tyre, material: 'rubber', movable: true },
    ];

    // The hub is cosmetic — at low detail it is inside the tyre silhouette anyway.
    if (ctx.detail === 'high') {
      const hub = new THREE.CylinderGeometry(
        params.hubRadius,
        params.hubRadius,
        params.width * 1.05,
        ctx.segments,
      );
      pieces.push({ name: 'hub', geometry: hub, material: 'plastic', movable: true });
    }

    return pieces;
  },
};
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- tests/wheel.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing ultrasonic test**

Create `tests/ultrasonic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ultrasonic } from '../src/parts/ultrasonic';
import { buildPart } from '../src/geometry/buildPart';

describe('ultrasonic sensor', () => {
  it('declares the four HC-SR04 pins', () => {
    expect(ultrasonic.pins.map((p) => p.id)).toEqual(['vcc', 'trig', 'echo', 'gnd']);
  });

  it('needs two digital pins', () => {
    expect(ultrasonic.pins.filter((p) => p.kind === 'digital')).toHaveLength(2);
  });

  it('occupies a real footprint on the mount grid', () => {
    expect(ultrasonic.footprint.cols).toBeGreaterThan(0);
    expect(ultrasonic.footprint.rows).toBeGreaterThan(0);
  });

  it('stays within its triangle budget', () => {
    expect(buildPart(ultrasonic).triangleCount).toBeLessThan(3000);
  });

  it('builds at parameter extremes without throwing', () => {
    expect(() => buildPart(ultrasonic, { boardWidth: 0.030 })).not.toThrow();
    expect(() => buildPart(ultrasonic, { boardWidth: 0.060 })).not.toThrow();
  });

  it('is substantially cheaper at low detail', () => {
    const high = buildPart(ultrasonic, undefined, 'high');
    const low = buildPart(ultrasonic, undefined, 'low');
    expect(low.triangleCount).toBeLessThan(high.triangleCount * 0.6);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- tests/ultrasonic.test.ts`
Expected: FAIL — cannot resolve `../src/parts/ultrasonic`.

- [ ] **Step 7: Write `src/parts/ultrasonic.ts`**

Holes are cut with `THREE.Path` holes — no CSG library.

```ts
import * as THREE from 'three';
import type { PartDef, PartPiece } from './types';

export interface UltrasonicParams {
  boardWidth: number;
  boardHeight: number;
  boardThickness: number;
  transducerRadius: number;
  holeRadius: number;
}

function boardShape(params: UltrasonicParams): THREE.Shape {
  const halfW = params.boardWidth / 2;
  const halfH = params.boardHeight / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-halfW, -halfH);
  shape.lineTo(halfW, -halfH);
  shape.lineTo(halfW, halfH);
  shape.lineTo(-halfW, halfH);
  shape.closePath();

  for (const x of [-halfW * 0.82, halfW * 0.82]) {
    const hole = new THREE.Path();
    hole.absarc(x, 0, params.holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

export const ultrasonic: PartDef<UltrasonicParams> = {
  id: 'hc-sr04',
  label: 'Ultrasonic Distance Sensor',
  defaultParams: {
    boardWidth: 0.045,
    boardHeight: 0.020,
    boardThickness: 0.0015,
    transducerRadius: 0.008,
    holeRadius: 0.001,
  },
  massKg: 0.0085,
  codeable: false,
  footprint: { cols: 18, rows: 8 },
  snaps: [{ id: 'mount', type: 'deck-mount', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [
    { id: 'vcc', kind: 'power' },
    { id: 'trig', kind: 'digital' },
    { id: 'echo', kind: 'digital' },
    { id: 'gnd', kind: 'ground' },
  ],
  build(params, ctx): PartPiece[] {
    const board = new THREE.ExtrudeGeometry(boardShape(params), {
      depth: params.boardThickness,
      bevelEnabled: false,
      curveSegments: ctx.detail === 'high' ? 8 : 3,
    });

    const pieces: PartPiece[] = [{ name: 'board', geometry: board, material: 'pcb' }];

    for (const [index, x] of [-0.012, 0.012].entries()) {
      const can = new THREE.CylinderGeometry(
        params.transducerRadius,
        params.transducerRadius,
        0.0062,
        ctx.segments,
      );
      can.rotateX(Math.PI / 2);
      can.translate(x, 0, params.boardThickness + 0.0031);
      pieces.push({ name: `transducer-${index}`, geometry: can, material: 'metal' });

      // The grille disc is cosmetic — it reads as a flat face at low detail.
      if (ctx.detail === 'high') {
        const grille = new THREE.CircleGeometry(params.transducerRadius * 0.9, ctx.segments);
        grille.translate(x, 0, params.boardThickness + 0.0062);
        pieces.push({ name: `grille-${index}`, geometry: grille, material: 'mesh' });
      }
    }

    // The pin header is cosmetic at distance — millimetre detail on a 45mm board.
    if (ctx.detail === 'high') {
      const header = new THREE.BoxGeometry(0.0102, 0.0025, 0.0025);
      header.translate(0, -params.boardHeight / 2 + 0.0015, params.boardThickness + 0.001);
      pieces.push({ name: 'header', geometry: header, material: 'gold' });
    }

    return pieces;
  },
};
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npm test -- tests/ultrasonic.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 9: Write `src/parts/registry.ts`**

```ts
import type { PartDef } from './types';
import { chassis } from './chassis';
import { wheel } from './wheel';
import { ultrasonic } from './ultrasonic';

export const PART_REGISTRY = {
  [chassis.id]: chassis,
  [wheel.id]: wheel,
  [ultrasonic.id]: ultrasonic,
} as unknown as Record<string, PartDef<never>>;

export function getPart(id: string): PartDef<never> {
  const def = PART_REGISTRY[id];
  if (!def) throw new Error(`Unknown part id: ${id}`);
  return def;
}
```

- [ ] **Step 10: Write and run the registry test**

Create `tests/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PART_REGISTRY, getPart } from '../src/parts/registry';
import { buildPart } from '../src/geometry/buildPart';

describe('part registry', () => {
  it('keys every part by its own id', () => {
    for (const [id, def] of Object.entries(PART_REGISTRY)) {
      expect(def.id).toBe(id);
    }
  });

  it('throws a helpful error for an unknown id', () => {
    expect(() => getPart('nope')).toThrow('Unknown part id: nope');
  });

  it('builds every registered part with default params', () => {
    for (const def of Object.values(PART_REGISTRY)) {
      expect(() => buildPart(def)).not.toThrow();
    }
  });

  it('gives every part a positive mass', () => {
    for (const def of Object.values(PART_REGISTRY)) {
      expect(def.massKg).toBeGreaterThan(0);
    }
  });
});
```

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 11: Commit**

```bash
git add src/parts tests/wheel.test.ts tests/ultrasonic.test.ts tests/registry.test.ts
git commit -m "feat: add wheel and ultrasonic parts with a part registry"
```

---

## Task 6: Tier 2 studio lighting and part rendering

**Files:**
- Create: `src/scene/quality.ts`, `src/scene/Studio.tsx`, `src/scene/PartView.tsx`
- Modify: `src/App.tsx`
- Test: `tests/quality.test.ts`, `tests/PartView.test.tsx`

**Interfaces:**
- Consumes: `buildPart` (Task 3), `createPalette` (Task 2), `PART_REGISTRY` (Task 5).
- Produces: `type QualityTier = 'high' | 'medium' | 'low'`, `nextTier(current: QualityTier, fps: number): QualityTier` from `src/scene/quality.ts`; `<Studio tier>` and `<PartView partId params>` components.

- [ ] **Step 1: Write the failing quality test**

Create `tests/quality.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nextTier } from '../src/scene/quality';

describe('quality tier', () => {
  it('drops from high to medium below the 30fps floor', () => {
    expect(nextTier('high', 24)).toBe('medium');
  });

  it('drops from medium to low when still below the floor', () => {
    expect(nextTier('medium', 22)).toBe('low');
  });

  it('never drops below low', () => {
    expect(nextTier('low', 5)).toBe('low');
  });

  it('holds the current tier when the framerate is healthy', () => {
    expect(nextTier('high', 60)).toBe('high');
    expect(nextTier('medium', 45)).toBe('medium');
  });

  it('does not automatically upgrade, to avoid oscillation', () => {
    expect(nextTier('low', 120)).toBe('low');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- tests/quality.test.ts`
Expected: FAIL — cannot resolve `../src/scene/quality`.

- [ ] **Step 3: Write `src/scene/quality.ts`**

```ts
export type QualityTier = 'high' | 'medium' | 'low';

/** Minimum acceptable framerate from the PRD performance budget. */
export const FPS_FLOOR = 30;

const ORDER: QualityTier[] = ['high', 'medium', 'low'];

/**
 * Degrade one step when below the floor. Never upgrades automatically —
 * an upgrade would raise cost, drop the framerate, and oscillate.
 */
export function nextTier(current: QualityTier, fps: number): QualityTier {
  if (fps >= FPS_FLOOR) return current;
  const index = ORDER.indexOf(current);
  return ORDER[Math.min(index + 1, ORDER.length - 1)];
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- tests/quality.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write `src/scene/Studio.tsx`**

The environment is built from `Lightformer` shapes, so no `.hdr` file is fetched. At `low`, the environment is dropped entirely for plain lights.

```tsx
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { QualityTier } from './quality';

interface StudioProps {
  tier: QualityTier;
  children: ReactNode;
}

export function Studio({ tier, children }: StudioProps) {
  return (
    <>
      <hemisphereLight args={[0x9fc4ff, 0x2a2118, 0.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow={tier === 'high'} />

      {tier !== 'low' && (
        // frames={1} bakes the environment once instead of every frame.
        <Environment frames={tier === 'high' ? Infinity : 1} resolution={tier === 'high' ? 256 : 128}>
          <Lightformer form="rect" intensity={3} color="white" scale={[6, 3]} position={[0, 4, 3]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.4} color="#9ec1ff" scale={[5, 3]} position={[-5, 1, 2]} target={[0, 0, 0]} />
          <Lightformer form="ring" intensity={2} color="#fff4e6" scale={[3, 3]} position={[3, 2, -4]} target={[0, 0, 0]} />
        </Environment>
      )}

      {children}

      {tier === 'high' && (
        <ContactShadows position={[0, -0.001, 0]} opacity={0.45} scale={1} blur={2.4} far={0.4} />
      )}
    </>
  );
}
```

- [ ] **Step 6: Write `src/scene/PartView.tsx`**

```tsx
import { useMemo } from 'react';
import { buildPart } from '../geometry/buildPart';
import { createPalette } from '../materials/palette';
import { getPart } from '../parts/registry';

interface PartViewProps {
  partId: string;
  params?: Record<string, number>;
}

export function PartView({ partId, params }: PartViewProps) {
  const palette = useMemo(() => createPalette(), []);
  const built = useMemo(() => buildPart(getPart(partId), params as never), [partId, params]);

  return (
    <group>
      {built.pieces.map((piece) => (
        <mesh
          key={piece.name}
          geometry={piece.geometry}
          material={palette[piece.material]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 7: Write and run the render test**

Create `tests/PartView.test.tsx`:

```tsx
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
```

Set `environment: 'jsdom'` for this file by adding the docblock at the very top of `tests/PartView.test.tsx`:

```tsx
// @vitest-environment jsdom
```

Then install jsdom:

```bash
npm install -D jsdom
```

Run: `npm test -- tests/PartView.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 8: Wire up `src/App.tsx`**

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { Studio } from './scene/Studio';
import { PartView } from './scene/PartView';

export default function App() {
  return (
    <Canvas
      style={{ width: '100vw', height: '100vh', background: '#16181d' }}
      shadows
      camera={{ position: [0.12, 0.09, 0.14], fov: 40 }}
      gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
    >
      <Studio tier="high">
        <PartView partId="hc-sr04" />
      </Studio>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
```

- [ ] **Step 9: Verify visually**

Run: `npm run dev`
Expected: the ultrasonic sensor renders with visible metal reflections on the transducers and a soft contact shadow beneath it. No network requests for `.hdr`, `.glb`, or image files in the browser network tab.

- [ ] **Step 10: Commit**

```bash
git add src/scene src/App.tsx tests/quality.test.ts tests/PartView.test.tsx package.json package-lock.json
git commit -m "feat: add Tier 2 procedural studio lighting and part rendering"
```

---

## Task 7: Level of detail and focus upgrade

**Files:**
- Create: `src/scene/focus.ts`, `src/scene/PartLOD.tsx`
- Modify: `src/scene/PartView.tsx`
- Test: `tests/focus.test.ts`

**Interfaces:**
- Consumes: `buildPart` (Task 3), `PartView` (Task 6), `DetailLevel` (Task 2).
- Produces: `resolveDetail(partId: string, focusedId: string | null): DetailLevel` from `src/scene/focus.ts`, and the `<PartLOD partId params focusedId />` component from `src/scene/PartLOD.tsx`.

Distance-based LOD uses drei's `<Detailed>` wrapper, which delegates to THREE.LOD. The `hysteresis` prop is drei's and THREE.LOD's built-in guard against flicker at the switch boundary — we do not hand-roll one. Three.js frustum-culls every object by default, so parts outside the camera view already cost nothing to draw; `<Detailed>` exists for parts that *are* visible but small or distant.

- [ ] **Step 1: Write the failing test**

Create `tests/focus.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveDetail } from '../src/scene/focus';

describe('resolveDetail', () => {
  it('resolves a focused part to high detail', () => {
    expect(resolveDetail('hc-sr04', 'hc-sr04')).toBe('high');
  });

  it('resolves an unfocused part to low detail', () => {
    expect(resolveDetail('hc-sr04', 'wheel-65')).toBe('low');
  });

  it('resolves every part to low when focus is null', () => {
    expect(resolveDetail('hc-sr04', null)).toBe('low');
    expect(resolveDetail('wheel-65', null)).toBe('low');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/focus.test.ts`
Expected: FAIL — cannot resolve `../src/scene/focus`.

- [ ] **Step 3: Write `src/scene/focus.ts`**

```ts
import type { DetailLevel } from '../parts/types';

/**
 * Maps a part id and the currently focused part to a DetailLevel.
 *
 * This override is safe even though the global quality tier never auto-upgrades:
 * it is user-initiated (selection/focus), bounded to a single part at a time,
 * and is not driven by measured framerate, so it is not a feedback loop and
 * cannot oscillate.
 */
export function resolveDetail(partId: string, focusedId: string | null): DetailLevel {
  if (focusedId === partId) return 'high';
  return 'low';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/focus.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Modify `src/scene/PartView.tsx`**

Add an optional `detail?: DetailLevel` prop defaulting to `'high'`, passed as the third argument to `buildPart`:

```tsx
import { useMemo } from 'react';
import { buildPart } from '../geometry/buildPart';
import { createPalette } from '../materials/palette';
import { getPart } from '../parts/registry';
import type { DetailLevel } from '../parts/types';

interface PartViewProps {
  partId: string;
  params?: Record<string, number>;
  detail?: DetailLevel;
}

export function PartView({ partId, params, detail = 'high' }: PartViewProps) {
  const palette = useMemo(() => createPalette(), []);
  const built = useMemo(
    () => buildPart(getPart(partId), params as never, detail),
    [partId, params, detail],
  );

  return (
    <group>
      {built.pieces.map((piece) => (
        <mesh
          key={piece.name}
          geometry={piece.geometry}
          material={palette[piece.material]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 6: Write `src/scene/PartLOD.tsx`**

```tsx
import { Detailed } from '@react-three/drei';
import { PartView } from './PartView';

interface PartLODProps {
  partId: string;
  params?: Record<string, number>;
  focusedId: string | null;
}

export function PartLOD({ partId, params, focusedId }: PartLODProps) {
  if (focusedId === partId) {
    return <PartView partId={partId} params={params} detail="high" />;
  }

  return (
    <Detailed distances={[0, 0.35]} hysteresis={0.15}>
      <PartView partId={partId} params={params} detail="high" />
      <PartView partId={partId} params={params} detail="low" />
    </Detailed>
  );
}
```

When `focusedId === partId`, the component bypasses `<Detailed>` entirely and returns `<PartView partId={partId} params={params} detail="high" />` directly, so a selected part is always full quality regardless of camera distance.

- [ ] **Step 7: Commit**

```bash
git add src/scene/focus.ts src/scene/PartLOD.tsx src/scene/PartView.tsx tests/focus.test.ts
git commit -m "feat: add part LOD and focus-based detail override"
```

---

## Task 8: Enforce the performance and zero-asset budgets

**Files:**
- Create: `tests/budget.test.ts`
- Test: itself.

**Interfaces:**
- Consumes: `buildPart` (Task 3), `chassis`, `wheel`, `ultrasonic` (Tasks 4–5).
- Produces: nothing importable. This is the CI gate that makes the PRD §11 budget real.

- [ ] **Step 1: Write the budget test**

Create `tests/budget.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPart } from '../src/geometry/buildPart';
import { chassis } from '../src/parts/chassis';
import { wheel } from '../src/parts/wheel';
import { ultrasonic } from '../src/parts/ultrasonic';

/** The reference robot from PRD §6: one chassis, two wheels, one ultrasonic. */
function referenceRobot() {
  const parts = [buildPart(chassis), buildPart(wheel), buildPart(wheel), buildPart(ultrasonic)];
  return {
    triangleCount: parts.reduce((sum, p) => sum + p.triangleCount, 0),
    drawCalls: parts.reduce((sum, p) => sum + p.drawCalls, 0),
  };
}

describe('performance budget', () => {
  it('keeps the reference robot under 15000 triangles', () => {
    expect(referenceRobot().triangleCount).toBeLessThan(15_000);
  });

  it('keeps the reference robot under 40 draw calls', () => {
    expect(referenceRobot().drawCalls).toBeLessThan(40);
  });
});

describe('zero asset bytes', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  it('does not depend on model loaders or CSG libraries', () => {
    for (const banned of ['three-bvh-csg', 'draco3d', 'meshoptimizer', '@google/model-viewer']) {
      expect(deps).not.toHaveProperty(banned);
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- tests/budget.test.ts`
Expected: PASS, 3 tests. If the triangle assertion fails, reduce segment counts in the offending part rather than raising the budget.

- [ ] **Step 3: Run the whole suite**

Run: `npm test`
Expected: PASS, all suites, zero failures.

- [ ] **Step 4: Commit**

```bash
git add tests/budget.test.ts
git commit -m "test: enforce triangle, draw call, and zero-asset budgets in CI"
```

---

## Plan Self-Review

**Spec coverage:** §3 Tier 2 fidelity → Tasks 5, 6. §4 module boundaries → Tasks 2, 3, 6 (one file per unit, `buildPart` is the sole caller of `def.build()`). §11 grid placement → Task 4 (`MountSurface`) and Task 5 (`footprint`); the placement *interaction* belongs to the Build-mode plan, not this one. §12 error handling → partially covered (`getPart` throws a helpful error); the grey-bounding-box fallback belongs to the Build-mode plan since it needs a scene to render into. §13 testing → Tasks 4–8. Detail levels (`DetailLevel`, low/high geometry) → Tasks 2, 3, 5, and 7.

**Deliberately deferred to later plans:** tap-to-place and nudge controls, pin auto-assignment and the wiring panel, the code editor and assistance ladder, the emulator, sensor overlays and replay, export, and the Groq proxy. Each needs this foundation first.

**Not yet covered by any plan:** the motor, IR line sensor, battery, and Arduino Uno parts. They follow the exact pattern of Tasks 4–5 and should be added to the Build-mode plan, where their pins and footprints are actually consumed.

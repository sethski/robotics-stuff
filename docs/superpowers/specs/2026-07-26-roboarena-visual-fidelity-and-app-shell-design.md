# RoboArena — Visual Fidelity, App Shell & Code Assistance

**Date:** 2026-07-26
**Status:** Approved design, ready for implementation planning
**Supersedes:** parts of PRD.md §7.1a, §9.1, §11 (PRD to be updated to v3 from this document)

---

## 1. What this document decides

PRD v2 committed to generating all 3D part geometry in Three.js rather than importing models, and
flagged one open trade-off: procedural parts look schematic, which may not be good enough. This
document resolves that trade-off and three others that fell out of it.

| # | Question | Decision |
|---|---|---|
| 1 | How good do procedural parts need to look? | **Tier 2** — Tier 1 geometry plus a procedural studio lighting rig. Validated by rendering the same part at four tiers and comparing. |
| 2 | How is the app laid out? | **Three full-screen modes** (Build / Code / Race), not a multi-pane workbench. |
| 3 | How does a user get from a part to its code? | Clicking the **board** in Build enters Code mode. Codeable parts are visibly marked. |
| 4 | How do non-coders write code? | A **four-layer ladder**; the first three work offline with no API cost, Groq is the top rung only. |

---

## 2. Standing principle: search open source first

**For every capability, search for an existing open-source library before writing it from scratch.
Only build it ourselves when nothing fits, and record the search and the verdict.**

This applies project-wide, not just to the decisions in this document. It has already changed two
choices below (§4, §7).

### 2.1 Search log

| Capability | Searched | Verdict |
|---|---|---|
| Zero-asset studio lighting | drei `Environment` + `Lightformer` | **Adopt.** Renders emissive shapes into a virtual scene, used as an env map. True studio reflections with no HDR file. Can freeze to a fixed frame count when framerate drops. |
| Grounding shadow | drei `ContactShadows` | **Adopt.** |
| Mesh booleans | `three-bvh-csg`, `manifold-3d` | **Adopt neither for MVP.** A 2026 browser benchmark found `three-bvh-csg` returns a watertight solid on only 22/1000 pairs and was the slowest of three browser options; its author confirms the T-vertex limitation. More importantly we don't need booleans — `THREE.Path` holes in an `ExtrudeGeometry` shape cover every MVP cut. If a non-flat cut ever appears, use `manifold-3d` (robust WASM), never `three-bvh-csg`. **Remove `three-bvh-csg` from the PRD stack.** |
| Accelerated raycasting for snap picking | `three-mesh-bvh` | **Adopt.** |
| AI ghost text in CodeMirror | `@marimo-team/codemirror-ai` (Apache 2.0), `codemirror-copilot` (MIT) | **Adopt `@marimo-team/codemirror-ai`.** Inline completion plus select-and-edit against a supplied async `prompt` callback; more actively developed. `codemirror-copilot` is the smaller fallback (FIM prefix/suffix, built-in prediction caching). Either way we write no widget plumbing. |
| Non-AI autocomplete | `@codemirror/autocomplete` | **Adopt.** Core CodeMirror; custom completion source. |
| Groq integration | `@ai-sdk/groq` + `ai` | **Adopt, server-side only.** Groq and AI SDK docs are both explicit that browser-side keys are insecure; `createGroq({ baseURL })` exists to point at a proxy. |
| Static geometry merging | `BufferGeometryUtils.mergeGeometries` | **Adopt.** Core three. |

---

## 3. Decision 1 — Tier 2 visual fidelity

### 3.1 How this was validated

Four tiers of the same HC-SR04 ultrasonic sensor were generated procedurally and rendered side by
side, with triangle counts measured live from the scene graph:

| Tier | What it is | Added weight | Authoring | Tris |
|---|---|---|---|---|
| 0 | Raw primitives, one flat material, 8-segment curves | 0 | ~40 min | ~400 |
| 1 | Bevelled extrusion, real mounting holes, canvas silkscreen, grille, gold pins | 0 | ~4 hrs | ~3k |
| **2** | **Tier 1 geometry + procedural studio lighting** | **~8 KB of library JS, 0 asset bytes** | **~1 day, once for all parts** | **~3k** |
| 3 | Imported glTF equivalent (chamfers, screws, solder joints, dense curves) | ~180 KB of **asset** bytes per part | ~1 day **per part** | ~14k |

Note the distinction in the weight column: Tier 2's ~8KB is drei library code that ships in the JS
bundle once. Tier 3's cost is downloaded asset data, per part, on top of the bundle.

The finding that drove the decision: **Tier 2 is the same geometry as Tier 1.** All of its gain
comes from lighting, which is a one-time cost amortised across the entire catalog. Tier 3's much
smaller additional gain costs bytes and a day of modelling *per part, forever*.

### 3.2 What Tier 2 means concretely

- drei `<Environment>` containing `<Lightformer>` shapes — a procedural studio HDRI with **no HDR
  file**, so the zero-asset-bytes rule in PRD §11 survives intact.
- drei `<ContactShadows>` for grounding.
- ACES filmic tone mapping.
- A shared material palette (~8 materials) with roughness/metalness tuned once, centrally. Metal
  reads as metal because it has an environment to reflect.

### 3.3 Quality tiers on weak devices

The renderer measures framerate and degrades in this order: freeze the environment map to a fixed
frame count (drei supports this directly) → drop contact shadows → fall back to plain directional
lights. Geometry is never reduced, so the robot never changes shape.

### 3.4 Explicitly out of scope

`@react-three/postprocessing` with N8AO and bloom would look better still, but a full-screen effect
pass is the most likely thing to break the 30fps budget on a budget Android tablet. Revisit
post-MVP behind a device-gated "high quality" toggle.

---

## 4. Module boundaries

Four units, each with one job and a narrow interface.

### `parts/`
One file per part exporting a `PartDef`: id, typed params, `build(params)` returning geometry plus
material **keys** (not materials), declared snap points, mass, a 2D collision footprint, and pin
definitions. Knows nothing about React, the scene, physics, or the editor — a pure data-and-geometry
function, testable by calling it and asserting on the result.

```ts
export const ultrasonic: PartDef<UltrasonicParams> = {
  id: 'hc-sr04',
  label: 'Ultrasonic Distance Sensor',
  params: { boardWidth: 0.045, boardHeight: 0.020, transducerRadius: 0.008 },
  massKg: 0.0085,
  codeable: false,
  build(p, ctx) { /* → { geometries, materialKeys } */ },
  snaps: [{ id: 'mount', type: 'frame-mount', position: [0, 0, 0], normal: [0, 0, 1] }],
  pins: [
    { id: 'vcc',  kind: 'power' },
    { id: 'trig', kind: 'digital' },
    { id: 'echo', kind: 'digital' },
    { id: 'gnd',  kind: 'ground' },
  ],
};
```

### `geometry/`
Takes a `PartDef` plus params, returns a built cached result. Owns the parameter-hash cache
(`Map<partId + JSON.stringify(params), BuiltPart>`), the merge of static sub-geometry into one draw
call, and Worker offload. **Nothing else calls `build()` directly.** This is what lets caching or
Worker strategy change without touching a single part file.

### `materials/`
~8 named `MeshStandardMaterial` instances (`pcb`, `metal`, `gold`, `dark`, `plastic`, …) with Tier 2
values tuned once. Parts reference them by key — which is exactly why `build()` returns keys rather
than materials, and why Tier 2 is a one-time cost.

### `scene/`
R3F rendering. Owns the `Environment`/`Lightformer` rig, `ContactShadows`, camera, and the quality
tier. Consumes built parts; never builds them.

**Key property:** a part author touches only `parts/`; a rendering change touches only `scene/` and
`materials/`. Neither can break the other.

---

## 5. Decision 2 — App shell: three modes

Three full-screen stages rather than a multi-pane workbench, chosen for beginner friendliness. Each
screen teaches one idea at a time and the layout survives down to phone width.

**Not building:** a "grows into a workbench once you're experienced" second layout. It doubles the
layout work to serve users who don't exist yet. Post-MVP option, not MVP scope.

The modes are views over one shared client-side state, not three apps.

- **Build** owns a `RobotDesign` — placed parts, each with part id, params, transform, and the snap
  point it attaches to. The only thing the user edits here, and the JSON persisted to the backend.
- **Code** owns a source string. Pin autocomplete is **derived from the `RobotDesign`** — if you
  haven't placed an ultrasonic sensor, its pins aren't offered. This is what stops Code from feeling
  like a detached text editor.
- **Race** derives everything and owns nothing persistent. On entry it compiles the design into a
  `SimRobot` (mass and collision footprint summed from placed parts, sensors registered against
  their pins) and runs the emulator. Leaving discards it.

Mode switching costs nothing technically — emulator, physics, and renderer are client-side and stay
alive regardless of which panel is visible.

**Handoffs are readiness checks, not hard gates.** Build reports when the design is runnable, Code
reports when it parses, and Race is reachable regardless — watching a broken robot fail teaches more
than a disabled button.

**Consequence, accepted:** because Race is fully derived, editing the robot mid-race is impossible by
construction. Go back to Build, change it, re-enter.

---

## 6. Decision 3 — Part-driven navigation into Code

`PartDef` carries a `codeable` flag, so "is this programmable" is declared by the part rather than
special-cased for the Uno.

- **Only the Arduino Uno is codeable in MVP.** This is honest to how hardware works: sensors aren't
  programmed, the board is.
- Build renders codeable parts with a persistent indicator — drei `<Outlines>` plus a small badge.
  Costs nothing extra; reuses the shared material palette.
- Clicking the board enters Code mode directly.
- Returning from Code lands back in Build **with that part still selected**, so the round trip
  doesn't lose the user's place.

---

## 7. Decision 4 — The code assistance ladder

AI is the top rung, not the answer to "I can't code." Layers 1–3 work offline with zero API cost.

**Layer 1 — Prefilled starter sketch.** Generated on entry to Code mode from the actual
`RobotDesign`. Because we know which pins the user's motors and sensors landed on, the `pinMode`
calls and named pin constants are already written and correct. This alone removes the blank page for
most beginners.

**Layer 2 — Curated snippet library.** Known-good insertable blocks: "drive forward", "read the line
sensor", "turn left". Deterministic, offline, reviewed by us.

**Layer 3 — Real autocomplete.** `@codemirror/autocomplete` with a completion source built from the
Arduino subset **plus the parts actually on the robot**, so it can only ever suggest pins that
exist. Offline, deterministic, and it teaches the API surface.

**Layer 4 — Groq.** Ghost-text completion via `@marimo-team/codemirror-ai`, plus plain-English error
explanations. Offline, this layer is simply absent and everything else still works.

### 7.1 Groq access model

- **Key never reaches the browser.** A **Cloudflare Worker** holds `GROQ_API_KEY` and proxies
  requests; the client uses `createGroq({ baseURL: <worker> })` with no key. Cloudflare is already
  the hosting choice in PRD §9.6, so this adds no new infrastructure.
- **Free to the user, gated behind login,** with a per-account daily cap enforced in the Worker.
- **Small fast model for completions** (latency and cost both matter for ghost text); a larger model
  only for error explanations, which are rare and user-initiated.
- Unauthenticated requests are rejected — an open endpoint will be scraped.

---

## 8. Error handling

**Principle: user mistakes are content, not failures.** This is a teaching tool; the interesting
errors deserve real treatment.

- **Infinite loop** — the beginner-classic `while(1)` with no delay would hang the tab. The emulator
  gets a per-frame execution budget; if `loop()` doesn't yield in time, the sim pauses and reports
  which line it is stuck on.
- **Parse and runtime errors** map to line numbers and surface inline in Code. An error mid-race
  pauses the run at the offending line rather than the robot quietly stopping.
- **Part build failure** — a `build()` that throws renders as a grey bounding box with a warning
  badge. One bad part definition cannot take down the scene.
- **WebGL context loss** is caught and recovered.
- **Low framerate** auto-downgrades the quality tier (§3.3).
- **Save failure** falls back to localStorage and retries. A design is never lost to a flaky
  connection.
- **Groq unavailable or over cap** — layer 4 disappears silently, layers 1–3 unaffected.

---

## 9. Testing

- **Part definitions** are pure functions: call `build()` and assert triangle count, bounding box,
  snap point positions, and mass. No rendering involved.
- **Parameter extremes** — every part builds at min and max of each param without throwing.
- **Emulator golden tests** — a known sketch produces a known sequence of pin states.
- **Determinism test** — same design + same code + same track, run twice, identical score. This is
  what makes leaderboards meaningful.
- **Performance budget as CI assertion** — the reference robot's triangle count and draw calls are
  asserted, so a regression fails the build.
- **One Playwright smoke test** covering the full Build → Code → Race loop.

---

## 10. Changes required to PRD.md

1. §9.1 — remove `three-bvh-csg`; add drei `Environment`/`Lightformer`, `ContactShadows`,
   `three-mesh-bvh`. Note `manifold-3d` as the boolean option *if ever needed*.
2. §7.1a — replace the CSG row in the geometry toolkit table with `Shape`/`Path` holes; add the
   Tier 2 lighting and quality-tier detail.
3. §7.1a "Accepted trade-off" — update: fidelity is Tier 2, not raw schematic.
4. §11 — add draw call and triangle budgets; adjust asset-byte line to account for ~8KB lighting.
5. New section — the app shell (three modes) and the code assistance ladder.
6. New section — the search-open-source-first principle (§2 here), as a project-wide rule.
7. §13 — close the model-licensing question; add the AI cost-cap question if usage grows.

---

## 11. Out of scope

- Postprocessing (N8AO, bloom) — post-MVP, device-gated.
- Workbench layout — post-MVP.
- Codeable peripherals — MVP is board-only.
- Bring-your-own-key for Groq — revisit if educators ask for classroom-scale usage.
- Mesh booleans of any kind.

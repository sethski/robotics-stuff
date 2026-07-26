# Product Requirements Document

## RoboArena — Web-Based Robot Design, Programming & Competition Platform

**Status:** Draft v2
**Owner:** Troy
**Last updated:** July 2026

**Changes in v2:** all 3D part geometry is now *generated in code with Three.js* rather than authored in a modelling tool and imported as glTF. See §7.1a and §9.1. This removes the asset pipeline, the object storage tier, and the model-licensing open question entirely.

---

## 1. Vision

A browser-based platform where anyone — no hardware or electronics background required — can design a robot from modular 3D components, program its microcontroller in real code, test it against virtual competitions (mazes, tracks), and eventually export a working sketch + wiring blueprint to build the same robot in real life.

The experience should feel like **"Scratch meets Arduino IDE meets a physics sandbox"** — approachable for beginners, but built on real, transferable skills (actual Arduino/ESP32 code, real electronics concepts) so nothing learned is throwaway.

**Primary design constraint:** must run smoothly on **low-end devices and low-bandwidth connections** — this shapes almost every technical decision below.

---

## 2. Problem Statement

- Learning robotics normally requires buying hardware upfront, with no safe way to experiment, fail, and iterate for free.
- Existing robotics simulators (Webots, Gazebo, VREP) are powerful but heavy, desktop-only, and intimidating for beginners.
- Block-coding robot tools (e.g. mBlock) simplify too much — kids don't graduate to real code or real hardware concepts.
- There's no simple, free, browser-based bridge between **"I designed this virtually"** and **"I built this for real."**

---

## 3. Target Users


| Segment                                 | Need                                                       |
| --------------------------------------- | ---------------------------------------------------------- |
| Students / hobbyist beginners           | Learn robotics concepts without buying parts first         |
| Robotics clubs / competitions (schools) | Practice/prototype robot designs before physical build day |
| Educators                               | A sandboxed teaching tool with real code, safely simulated |
| Makers with partial hardware knowledge  | Validate design + code before wiring anything              |


---

## 4. Core Product Pillars

1. **3D Robot Builder** — assemble a robot from modular components (frame, wheels, motors, MCU, sensors) with physically sensible snapping. Every component's mesh is **generated procedurally in Three.js from a parameter set**, so parts are code, not downloadable assets.
2. **Real Code, Real Board** — program the actual microcontroller using real Arduino-style C++ in an embedded IDE, run against a JS-based emulator.
3. **Simulated Competition** — test the robot in physics-simulated mazes/tracks with simulated sensor input (IR, ultrasonic, etc.).
4. **Real-World Export** — generate an Arduino sketch (unmodified from what was written/tested) + a parts list + wiring diagram to build the same robot physically.

---

## 5. Explicit Non-Goals (v1)

- Not simulating custom/arbitrary hardware — v1 targets **one board** (Arduino Uno) and a fixed component set.
- Not doing full electrical/circuit simulation (voltage, current draw, PCB routing) — v1 is behavioral/logical simulation only.
- Not supporting multiplayer real-time races in v1 (async leaderboards only).
- Not building a native app — web-only, but installable as a PWA.

---

## 6. MVP Scope

To avoid building an "everything app" before validating the core loop, MVP is deliberately narrow:

- **1 chassis type** (small 2-wheel-drive rectangular frame)
- **1 microcontroller**: Arduino Uno (simulated)
- **Components**: 2x DC motor + wheel, 1x IR line sensor pair, 1x ultrasonic sensor, battery pack (fixed, non-configurable power) — 7 procedural part definitions total, all generated in Three.js (§7.1a)
- **1 competition mode**: line-following maze
- **1 prebuilt track** + a basic track editor (grid-based)
- **Code editor**: Monaco, Arduino-subset C++ (setup/loop, digitalWrite/Read, analogWrite/Read, delay, Serial.print)
- **Export**: downloadable `.ino` file + a static wiring diagram image + parts list

Everything else (multiple boards, custom chassis shapes, obstacle courses, racing mode, multiplayer, real sensor variety) is explicitly **post-MVP**.

---

## 7. Detailed Feature Requirements

### 7.1 Robot Builder (3D)

- Drag-and-drop part placement in a 3D scene.
- Snap-point system: each part exposes defined attachment points (e.g., frame has 4 wheel mounts, 1 MCU mount, 2 sensor mounts); incompatible parts can't attach.
- Real-time weight/balance feedback (simple heuristic, not full physics, for MVP).
- Save/load robot designs (JSON describing part IDs + their parameters + positions/rotations).

### 7.1a Procedural Part Geometry (no imported models)

Every part in the catalog is defined by a **part definition module** — a small TypeScript file that returns geometry, snap points, and metadata from a parameter object. Nothing is downloaded, nothing is authored in Blender.

A part definition looks like this:

```ts
export const dcMotor: PartDef<MotorParams> = {
  id: 'dc-motor-tt',
  label: 'TT Gear Motor',
  params: { bodyLength: 0.07, bodyRadius: 0.011, shaftLength: 0.01 },
  massKg: 0.032,
  build(p, ctx) {
    // returns THREE.BufferGeometry[] + materials, assembled from primitives
  },
  snaps: [
    { id: 'mount',  type: 'frame-mount', position: [0, 0, 0],  normal: [0, 0, 1] },
    { id: 'shaft',  type: 'wheel-shaft', position: [0, 0, 0.04], normal: [0, 0, 1] },
  ],
  pins: [ { id: 'in1', kind: 'digital' }, { id: 'in2', kind: 'digital' } ],
};
```

**Geometry toolkit (all Three.js core unless noted):**


| Need                                                                         | Approach                                                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chassis plates, brackets, sensor bodies                                      | `BoxGeometry` + rounded-corner variants via `ExtrudeGeometry` with a `Shape` and `bevelEnabled`                                                        |
| Wheels, motor bodies, standoffs, shafts                                      | `CylinderGeometry` / `TorusGeometry`                                                                                                                   |
| Arbitrary 2D outlines extruded to 3D (chassis with cutouts, PCB silhouettes) | `THREE.Shape` + `Path` holes → `ExtrudeGeometry` — this covers the large majority of robot parts, which are fundamentally flat profiles with thickness |
| Booleans (mounting holes, slots, cable channels)                             | `three-bvh-csg` (MIT) — fast BVH-accelerated CSG; run **once at part-build time**, cache the result, never per frame                                   |
| Wheel tread, connector pins, hole patterns                                   | `InstancedMesh` of a single small primitive rather than distinct geometry                                                                              |
| Board silkscreen, labels, LED lenses, sensor faces                           | Generated `CanvasTexture` (draw with 2D canvas API at build time) instead of image files                                                               |
| Wires between components                                                     | `TubeGeometry` along a `CatmullRomCurve3` between two pin positions, generated live from the wiring graph                                              |


**Rules that keep this cheap:**

- **Build once, cache by parameter hash.** A `Map<string, BuiltPart>` keyed on `partId + JSON.stringify(params)`. Geometry is only regenerated when a parameter actually changes.
- **Share materials globally.** One `MeshStandardMaterial` per palette color (~8 total) reused across every part, so the whole robot batches well.
- **Merge static sub-geometry.** Within a part, merge all non-moving pieces with `mergeGeometries` (from `three/examples/jsm/utils/BufferGeometryUtils`) into a single draw call. Only genuinely moving pieces (wheels) stay separate.
- **Low, fixed segment counts.** Cylinders/tori use 12–16 radial segments. Flat shading by default. This is a deliberate art direction (chunky low-poly), not a compromise.
- **Build off the main thread when it's slow.** CSG-heavy parts build in a Web Worker and transfer the resulting `BufferAttribute` arrays back, so the UI never stalls on a part drop.

**Why this is the right call:**

- Zero asset bytes over the wire — parts cost only the JS that describes them (a few KB total for the whole catalog vs. hundreds of KB of compressed glTF).
- No licensing question, no attribution tracking, no style-consistency drift across contributors.
- Parts become **parametric**: one chassis definition with `length`/`width`/`holeSpacing` params replaces a dozen hand-modelled variants, and directly enables the post-MVP "custom chassis" feature for nearly free.
- Snap points, mass, collision shapes, and pin locations are declared alongside the geometry that they refer to, so they can't drift out of sync the way a separate model file + separate metadata file will.
- The same parameters that drive geometry drive the **parts list and wiring diagram** on export — one source of truth.

**Accepted trade-off:** parts will look schematic/stylized rather than photoreal. For a teaching tool aimed at low-end hardware this is a feature, but it does mean the app will never look like a product render, and complex organic shapes (a servo horn's exact contour, a specific sensor's housing) will be approximations.

**Escape hatch:** the `PartDef.build()` contract returns geometry — nothing stops a future part from returning a loaded glTF instead. Procedural is the default and the entire MVP catalog, not a hard architectural ban.

### 7.2 Virtual IDE

- Monaco-based code editor embedded when clicking the MCU.
- Syntax highlighting + basic autocomplete for supported Arduino subset.
- Inline error messages (from the interpreter, mapped back to line numbers).
- "Run" button compiles nothing (interpreted, not compiled) — executes against the emulator in-browser.

### 7.3 Emulation Layer

- JS-based interpreter for a defined subset of Arduino C++(not a full C++ compiler — an interpreter that supports the common subset used in beginner/intermediate robotics sketches).
- Virtual pin state (digital/analog in/out) wired to the simulated robot's motors and sensors.
- Fixed timestep loop matching real Arduino loop() timing behavior (approximate, not cycle-accurate).

### 7.4 Physics & Competition Simulation

- 2D-constrained physics is sufficient for ground robots (even though rendered in 3D) — reduces compute cost significantly vs. full 3D rigid-body physics.
- Simulated sensors return values based on the robot's virtual position relative to the track/maze (e.g., IR sensor reads black/white line under it; ultrasonic returns distance to nearest wall).
- Track editor: grid-based, place walls/lines/start/finish.
- Scoring: time-to-complete, collisions, off-track events.

### 7.5 Export / Real-World Bridge

- Export exact user-written code as a `.ino` file (no transpilation needed since code is already real Arduino syntax).
- Generate a wiring diagram (SVG, generated from the component graph — which pins connect to which component) and a parts list (with links to buy, e.g. Arduino Uno, specific motor driver, etc.).
- Stretch goal (post-MVP): import code back after real-world testing, diff against original.

---

## 8. Why Low-Bandwidth / Low-End-Device Support Shapes the Stack

Because this needs to work well on constrained connections and modest hardware, every layer below is chosen with a **"lightest option that still does the job"** filter — favoring low bundle size, GPU-light rendering, and offline-capable architecture over maximal fidelity.

---

## 9. Proposed Open-Source Tech Stack

### 9.1 Frontend / 3D Rendering


| Tool                             | Why                                                                                                                                                                                                                                                                  | License |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Three.js**                     | De facto standard for browser 3D; huge ecosystem, small core (~150KB gzipped for the essentials). Critically, its built-in primitive and `ExtrudeGeometry` API is expressive enough to author the entire part catalog in code — no modelling tool, no asset pipeline | MIT     |
| **React Three Fiber** + **drei** | Declarative Three.js in React; drei gives ready-made helpers (gizmos, controls, `<Merged>`, bounds) so you're not reinventing common 3D UI patterns                                                                                                                  | MIT     |
| **three-bvh-csg**                | Fast BVH-accelerated boolean operations, used at part-build time to cut mounting holes/slots out of generated geometry                                                                                                                                               | MIT     |
| **three-mesh-bvh**               | Accelerated raycasting for snap-point picking and hover highlighting in a scene with many small meshes                                                                                                                                                               | MIT     |


**Deliberately not in the stack:** glTF/GLB loaders, Draco/meshopt decoders, `model-viewer`, and any object-storage tier for models. Because geometry is generated (§7.1a), none of these are needed — which removes roughly 100–150KB of decoder payload and every model fetch from the critical path.

**Low-bandwidth tactics:**

- The part catalog ships as JS part-definition modules, code-split per part family and lazily imported on first use. A part costs single-digit KB rather than a model download.
- Textures are generated as `CanvasTexture` at runtime rather than fetched as images.
- Shared low-poly primitive style with low fixed segment counts — a bandwidth win *and* a GPU win on low-end laptops/phones.
- Parts-catalog thumbnails are rendered once from the live scene into an offscreen canvas and cached, rather than shipped as images.

### 9.2 Physics


| Tool                                                             | Why                                                                                                                                               | License          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **Rapier** (via `@dimforge/rapier3d` or the 2D build `rapier2d`) | Rust-compiled-to-WASM physics engine; very fast, small footprint, deterministic — good for competitive scoring where results must be reproducible | Apache 2.0 / MIT |


Since ground-robot behavior is effectively 2D (position + heading + wheel speeds), using **Rapier 2D** instead of 3D physics cuts CPU/GPU cost substantially while the *visual* scene stays 3D (physics drives a 2D transform, rendering just extrudes it).

### 9.3 Code Editor


| Tool                          | Why                                                                                                                                                                            | License |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **Monaco Editor**             | Same engine as VS Code; excellent syntax highlighting, can be configured with a custom Arduino-C++-subset language definition; already used in millions of production web apps | MIT     |
| Alternative: **CodeMirror 6** | Notably lighter-weight than Monaco (a few hundred KB vs ~2-5MB for Monaco) — worth strongly considering given the low-bandwidth priority                                       | MIT     |


**Recommendation:** Given the explicit low-bandwidth requirement, **CodeMirror 6** is likely the better call over Monaco unless you specifically need VS-Code-identical UX. Monaco's bundle size is a real cost for users on slow connections.

### 9.4 Arduino Code Interpreter/Emulator

No single "drop-in" open-source project perfectly does "Arduino C++ in the browser," but there are strong building blocks:


| Tool                                                                     | Why                                                                                                                                                                                                   | License              |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **JSCPP**                                                                | A C++ interpreter written in JS — can be extended with Arduino-specific globals (`digitalWrite`, `pinMode`, `delay`, etc.) as injected functions                                                      | MIT                  |
| **Wokwi's simulation approach (reference only, not open-source itself)** | Wokwi is closed-source, but their public blog posts on how they built their Arduino simulator (interpreting AVR machine code with an emulator called avr8js) are a very useful reference architecture | N/A (reference only) |
| **avr8js**                                                               | An actual AVR microcontroller emulator in JS/TS — emulates real ATmega328p instructions, meaning code truly "compiles and runs" as if on real hardware, not just interpreted at the syntax level      | MIT                  |


**Recommendation:** For real accuracy (and to make the "export .ino and it just works on real hardware" promise trustworthy), **avr8js + a real avr-gcc-to-WASM compile step** is the gold-standard approach — this is genuinely how Wokwi does it. This is more work than a syntax-level interpreter, but it means you're not maintaining your own semi-correct C++ subset forever.

A lighter/faster-to-ship alternative for MVP: use **JSCPP** with a hand-written Arduino shim layer (implement `pinMode`, `digitalWrite`, `analogRead`, `delay`, `Serial.print` as JS functions injected into the interpreter's global scope). This ships faster but the "what you simulate is not literally what runs on hardware" gap is a known trade-off to accept for v1.

### 9.5 Backend / Data


| Tool                         | Why                                                                                                                                                        | License    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Supabase** (self-hostable) | Open-source Firebase alternative — Postgres + auth + storage + realtime, all self-hostable if you want full control, or usable as managed service to start | Apache 2.0 |
| **PocketBase**               | Extremely lightweight single-binary backend (Go), great if you want minimal infra overhead and low resource usage on a small server                        | MIT        |


For a low-bandwidth-first product, **PocketBase** is worth strong consideration — it's a single ~15MB binary, embeds SQLite, and has very low request overhead compared to heavier backend stacks.

### 9.6 Hosting / Delivery


| Tool                                     | Why                                                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Pages / Workers**           | Global edge CDN with a generous free tier — critical for low-latency delivery of static assets (models, JS bundles) to users on slow/distant connections |
| **Cloudflare R2** (or self-hosted MinIO) | Object storage for 3D model files, zero egress fees on R2                                                                                                |


### 9.7 PWA / Offline Support


| Tool                                    | Why                                                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vite PWA plugin** (`vite-plugin-pwa`) | Service-worker-based caching so the app (and cached model assets) works offline or on flaky connections after first load — huge win for the low-bandwidth goal |


---

## 10. High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                Browser (Client)               │
│                                                │
│  React App                                    │
│   ├─ Part Registry (procedural PartDefs)      │
│   │    └─ Geometry Builder + cache (Worker)   │
│   ├─ 3D Builder (R3F + Three.js + Rapier2D)   │
│   ├─ Code Editor (CodeMirror 6)               │
│   ├─ Emulator (avr8js / JSCPP + Arduino shim) │
│   └─ Export module (.ino + SVG wiring diagram)│
│                                                │
│  Service Worker (offline cache: JS only)      │
└───────────────────┬───────────────────────────┘
                     │  (only for save/load, auth, leaderboards)
                     ▼
┌─────────────────────────────────────────────┐
│         Backend (PocketBase / Supabase)       │
│   - User accounts                             │
│   - Saved robot designs (JSON)                │
│   - Leaderboards / competition results         │
└───────────────────┬───────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│   Object Storage (R2 / MinIO) — optional      │
│   - User-shared track/maze definitions (JSON) │
│   (No 3D model assets: geometry is generated) │
└─────────────────────────────────────────────┘
```

**Second architectural principle:** there is no asset pipeline. Part geometry is a pure function of `(partId, params)` evaluated in the browser, so adding a part is a code change that ships with the bundle — no upload step, no CDN invalidation, no version skew between a model file and the metadata describing it.

**Key architectural principle:** the entire simulation loop (physics + code execution + rendering) runs **entirely client-side**. The backend is only touched for auth, saving/loading designs, and leaderboard submission — meaning the app is fully usable offline once loaded, and network calls are minimal and infrequent, not continuous. This is the single biggest lever for low-bandwidth usability.

---

## 11. Performance & Low-Bandwidth Budget (targets)


| Metric                                                    | Target                                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Initial JS bundle (gzipped)                               | < 500KB for first interactive load                                                           |
| Network cost of a part                                    | 0 bytes of asset data; < 10KB gzipped for its lazily-imported definition module              |
| Part build time (geometry generation, cold)               | < 30ms on a mid-tier device; CSG-heavy parts offloaded to a Worker                           |
| Triangle budget for a fully assembled robot               | < 15k triangles                                                                              |
| Draw calls in builder view                                | < 40 (merged static geometry + shared materials)                                             |
| Time to interactive on 3G-equivalent connection           | < 5 seconds                                                                                  |
| Offline capability                                        | Fully usable builder + IDE + simulation after first load (trivially true — nothing to fetch) |
| Frame rate on low-end device (e.g. budget Android tablet) | 30fps minimum in builder and simulation views                                                |


---

## 12. Roadmap

**Phase 0 — Prototype (2–4 weeks)**

- Raw-primitive parts (boxes/cylinders) written directly against the `PartDef` contract, basic snapping, one hardcoded robot. Note that these placeholders are *the same system* as the final parts, just with cruder `build()` functions — so Phase 1 refines them rather than replacing them.
- CodeMirror + JSCPP-based interpreter with hand-written Arduino shim (fast to ship, validates the core loop).
- One hardcoded maze, no editor yet.
- Goal: prove "design → code → simulate" loop works end to end.

**Phase 1 — MVP (as scoped in Section 6)**

- Refined `build()` functions for the 7 MVP parts: bevelled extrusions, CSG-cut mounting holes, `CanvasTexture` labels/silkscreen, shared material palette.
- Geometry build cache + Worker offload for the CSG-heavy parts.
- Track editor.
- Export to `.ino` + wiring diagram + parts list.
- Basic auth + save/load designs (PocketBase or Supabase).

**Phase 2 — Depth**

- Additional boards (ESP32), additional sensors/motors.
- avr8js-based true emulation (replacing the JSCPP shim) for hardware-accurate simulation.
- Custom chassis shapes — largely falls out of the parametric part system: expose `length`/`width`/`holeSpacing` on the existing chassis `PartDef` rather than authoring new variants.
- Obstacle-course and racing competition modes.

**Phase 3 — Community & Competition**

- Leaderboards, shareable designs, community-submitted tracks.
- Real-time or async multiplayer races.
- Import-after-real-build workflow (diff real-world tweaks back into the virtual design).

---

## 13. Open Questions

- Should the emulator target real AVR bytecode (avr8js) from day one, or ship the simpler JSCPP shim first and migrate later? (Recommendation: shim first, migrate once core loop is validated — avoids over-building before knowing the concept resonates.)
- ~~Licensing/sourcing plan for 3D models~~ — **resolved in v2.** Geometry is generated procedurally (§7.1a), so there is no asset set to license, source, or style-match.
- How far to push visual fidelity before it stops paying for itself? Procedural parts are schematic by nature; the open question is whether beginners find that clarifying (a labelled, obviously-a-motor cylinder) or unconvincing. Worth a quick user test in Phase 1 rather than deciding by taste.
- Does anything in the catalog genuinely resist procedural generation (e.g. a servo horn contour)? If one or two parts do, take the escape hatch and load a glTF for those specifically rather than degrading the whole approach.
- Managed (Supabase) vs. self-hosted (PocketBase) backend — depends on how much infra Troy wants to own vs. offload.
- Monaco vs. CodeMirror — final call depends on how much VS-Code-specific UX (multi-cursor, command palette, etc.) is actually wanted vs. the bandwidth cost.

---

## 14. Success Metrics (early)

- % of users who complete the full loop (build → code → run in simulation) in a first session.
- Median time-to-first-successful-run for a new user.
- Load time / performance on throttled connections (measured, not assumed).
- Number of designs exported to real `.ino` files (signal that the real-world bridge is actually being used, not just the sim).
- Time to add a new part to the catalog (target: under a day for one person, end to end). This is the metric that tells you whether the procedural approach is actually paying off — if authoring a `PartDef` becomes slower than modelling a part in Blender would have been, the abstraction is wrong.


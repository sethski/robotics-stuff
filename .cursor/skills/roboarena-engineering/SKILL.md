---
name: roboarena-engineering
description: Standing engineering rules for RoboArena. Use when implementing parts, rendering, commits, dependencies, or any RoboArena feature work in this repo.
---

# RoboArena engineering

## Git identity

Commit as `Troy-LL <Troy-LL@users.noreply.github.com>`. No global git config on this machine. Always set **both** author and committer (GitHub rejects pushes that publish a private email as committer).

**Timezone:** author and committer dates must use **GMT+8 (`+0800`)**, not the machine’s local Pacific TZ. Set both date env vars on every commit:

```powershell
$stamp = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(8)).ToString('yyyy-MM-dd HH:mm:ss') + ' +0800'
$env:GIT_AUTHOR_NAME = 'Troy-LL'
$env:GIT_AUTHOR_EMAIL = 'Troy-LL@users.noreply.github.com'
$env:GIT_COMMITTER_NAME = 'Troy-LL'
$env:GIT_COMMITTER_EMAIL = 'Troy-LL@users.noreply.github.com'
$env:GIT_AUTHOR_DATE = $stamp
$env:GIT_COMMITTER_DATE = $stamp
git -c user.name=Troy-LL -c user.email=Troy-LL@users.noreply.github.com commit -m "..."
```

Never add `Co-Authored-By` lines. Never use a personal `@gmail.com` (or other private) address on commits.

## Search open source first

Before writing any general capability from scratch, search for an existing MIT/Apache-2.0 library. Prefer adopting it. Only build when nothing fits. Record the search and verdict in the design-spec search log when the capability is new.

## Zero asset bytes

No imported 3D models. No `.glb`, `.gltf`, `.hdr`, or image assets for parts. Geometry and textures are generated in code (Three.js primitives, `ExtrudeGeometry` + `Path` holes, `CanvasTexture`). Banned packages: `three-bvh-csg`, `draco3d`, `meshoptimizer`, `@google/model-viewer`.

## Domain shape

Parts are `PartDef` pure functions. Call `buildPart(def, params?, detail?)` only. Never call `def.build()` from scene or UI code. Materials are shared by `MaterialKey`. Units are metres.

## Quality and detail

Global render quality only degrades on low FPS (never auto-upgrades). Part detail uses high/low builds. Focused (clicked) parts force high detail. Distant visible parts use drei `<Detailed>` with hysteresis.

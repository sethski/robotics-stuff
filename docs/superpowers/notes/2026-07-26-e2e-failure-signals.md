# E2E harness — failure signals (2026-07-26)

Ad-hoc Playwright flow (`tmp-e2e-build.mjs` / unfinished `chore/e2e-harness`) was exercised against Build mode, then abandoned before merge. Capture the signals so a future harness does not repeat them.

## What already green-washed a real bug

| Signal | What happened |
|--------|----------------|
| DOM/console-only assertions | All 11 checks passed while the chassis rendered on its side (Z-up part space vs Y-up three.js world). |
| Nested `if (await locator.count())` around asserts | Pin reassignment never ran; no `08-pin-reassigned.png`; run still reported success. |
| Untracked script + `npm install --no-save` | Not reproducible; no `npm run e2e`; easy to drift from CI. |

## What hung / raced the runner

| Signal | What happened |
|--------|----------------|
| Silent after `vite preview` banner | Flow was running (or already passed) with no progress logs; looked stuck at `Local: http://127.0.0.1:5174/`. |
| Concurrent `npm run e2e` on the same port | Two runs shared `:5174` and `e2e-artifacts/`; screenshots interleaved; Chromium left `CLOSE_WAIT` sockets. |
| `browser.close()` / orphan `chrome-headless-shell` on Windows | Parent `e2e/run.mjs` never returned to the shell after a green `results.json`. |
| Soft port attach | Runner waited for *any* listener on the port instead of failing when the port was already taken. |

## What made the orientation pixel guard weak

| Signal | What happened |
|--------|----------------|
| Near-full-canvas silhouette | Measured bbox ≈ 1402×839 on a 1440×900 viewport (ratio ≈ 1.67). Studio fill / lighting counted as foreground, so "wider than tall" barely discriminated and could still pass a sideways robot. |
| Threshold without broken-adapter proof | A ratio floor of 1.5 was chosen from a correct render only; must prove fail under identity quaternion before trusting the guard. |

## Required properties for a future `npm run e2e`

1. Single command: build → preview → flow → teardown; exit non-zero on any failed assert; no orphans on Windows.
2. Fail loud: missing UI controls are failures, never skipped `if`s.
3. Fail fast if the preview port is already bound.
4. Progress logs after preview is ready and per major step.
5. At least one render assertion that **fails** when `ROBOT_SPACE_TO_WORLD_QUATERNION` is identity (empirically proven), with foreground detection tight enough that the silhouette is the robot, not the studio.
6. Artifacts under a gitignored directory; never commit screenshots.

## Shipped without this harness

Scene orientation adapter, snap-normal alignment, race readiness (root chassis counts), and untracking the force-added `.superpowers/` scratch report landed separately. Revisit E2E after those are on `master`.

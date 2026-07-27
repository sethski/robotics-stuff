---
name: roboarena-sdd
description: How to execute RoboArena implementation plans with subagent-driven development in this repo. Use when running SDD, dispatching plan tasks, or resuming after compaction.
---

# RoboArena SDD

## Workspace

Work on a `feat/*` branch in `.worktrees/`, never on `master` unless the user explicitly says so.

## Progress ledger

Path: `.superpowers/sdd/progress.md` (gitignored under `.superpowers/`).

Before any task dispatch, read the ledger. Tasks marked complete are done. Do not re-dispatch them.

After a clean task review, append:

```
Task N: complete (commits <base7>..<head7>, review clean)
```

## Dispatch

Use `subagent_type: "poteto-agent"` for implementers and fixers inside poteto-mode.

Hand requirements as a brief file via the SDD `task-brief` script. Put the full report path in the prompt. Return status only in chat.

Commit identity: follow `roboarena-engineering`.

## Plan

Foundation plan: `docs/superpowers/plans/2026-07-26-part-system-and-rendering-foundation.md`

Global constraints in that plan bind every task (zero assets, shared materials, segment caps, budget tests).

## Ecosystem skills (project-local)

Installed via [find-skills](https://www.skills.sh/vercel-labs/skills/find-skills) into `.cursor/skills/` (and `.agents/skills/`):

| Skill | Use when |
|---|---|
| `find-skills` | Searching for more skills with `npx skills find` |
| `react-three-fiber` | R3F / drei scene work (Tasks 6–7) |
| `3d-web-experience` | Broader WebGL / 3D UX patterns |
| `vite-patterns` | Vite config and app scaffold |
| `vitest-testing` | Writing or debugging Vitest suites |

Prefer these over reinventing stack guidance. RoboArena constraints in `roboarena-engineering` still win on conflicts (zero assets, Troy-LL commits, PartDef boundaries).

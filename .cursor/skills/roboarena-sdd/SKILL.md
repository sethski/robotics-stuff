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

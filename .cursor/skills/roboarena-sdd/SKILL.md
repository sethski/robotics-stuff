---
name: roboarena-sdd
description: How to execute RoboArena implementation plans with subagent-driven development in this repo. Use when running SDD, dispatching plan tasks, or resuming after compaction.
---

# RoboArena SDD

## Workspace

Never commit product work on `master`. Use `.worktrees/` for isolation.

## Branch graph (required)

Every plan task (and every parallel component slice) gets its **own branch** off the current integration tip.

Naming:

```
feat/task-<N>-<short-slug>
feat/task-<N>a-<short-slug>   # parallel slice
```

Examples: `feat/task-2-partdef-palette`, `feat/task-4-chassis`, `feat/task-5a-wheel-ultrasonic`.

**Integration branch** (e.g. `feat/part-system-foundation`) only receives merges. Implementers do not commit directly on it.

## Granular commits (required)

One logical change per commit. A single task usually produces **multiple** commits, for example:

1. failing test
2. minimal implementation that passes
3. follow-up polish only if needed

Never squash a whole task into one commit unless the user asks.

Author every commit as Troy-LL per `roboarena-engineering`.

## Dependency DAG and parallel waves

Schedule from the plan’s file dependencies, not from task number alone.

- **Serial spine:** shared types, cache, package scaffolding (one writer).
- **Parallel wave:** disjoint files only (e.g. chassis vs wheel/ultrasonic). Two worktrees or two branches off the same base. Neither touches the join file (e.g. `registry.ts`) until both land.
- **Join task:** registry / wiring / budget tests after the wave merges.

Never run two implementers that write the same path at once.

## Sequential push and merge (required)

After a task branch is review-clean:

1. `git push -u origin HEAD` for that task branch only.
2. Merge into the integration branch **one branch at a time** (PR or local merge). Resolve conflicts on that merge before starting the next merge.
3. Do not push or merge parallel branches “all at once.” Parallel **coding** is fine. Parallel **landing** is not.
4. Update `.superpowers/sdd/progress.md` with branch name, commit range, and merge SHA.

Order for this foundation plan after Task 3:

```
merge task-4-chassis
then merge task-5a-wheel-ultrasonic
then task-5b-registry (new branch off updated integration)
then task-6 → task-7 → task-8
```

## Progress ledger

Path: `.superpowers/sdd/progress.md` (under `.superpowers/`, gitignored).

Before dispatch, read the ledger. Do not re-dispatch completed tasks.

After a clean review and merge:

```
Task N: complete (branch feat/task-N-..., commits <base7>..<head7>, merged <sha>, review clean)
```

## Dispatch

Use `subagent_type: "poteto-agent"` for implementers and fixers in poteto-mode.

Each implementer prompt must include:

- base SHA / branch to create from
- their exclusive file paths
- “granular commits, not one commit for the whole task”
- “do not commit on the integration branch”

Hand requirements as a brief file. Report path in the prompt. Chat return is status only.

## Plan

Foundation plan: `docs/superpowers/plans/2026-07-26-part-system-and-rendering-foundation.md`

Global constraints in that plan bind every task.

## Ecosystem skills (project-local)

Installed via [find-skills](https://www.skills.sh/vercel-labs/skills/find-skills):

| Skill | Use when |
|---|---|
| `find-skills` | Searching for more skills with `npx skills find` |
| `react-three-fiber` | R3F / drei scene work (Tasks 6–7) |
| `3d-web-experience` | Broader WebGL / 3D UX patterns |
| `vite-patterns` | Vite config and app scaffold |
| `vitest-testing` | Writing or debugging Vitest suites |

Prefer these over reinventing stack guidance. `roboarena-engineering` wins on conflicts.

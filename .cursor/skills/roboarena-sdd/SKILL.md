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

## Sequential push, PR, review, merge (required)

Never merge a task branch locally into the integration branch. Landing is always:

1. Push the task branch only: `git push -u origin HEAD`.
2. Open a PR into the **integration branch** (e.g. `feat/part-system-foundation`), not directly into `master`.
   Use `gh pr create` with a short summary and test plan.
3. Controller reviews the PR (diff + checks). Fix via the task branch until the review is clean.
4. Merge **through that PR** (`gh pr merge`), one PR at a time.
5. Promote to default branch: open/merge a PR from the **integration branch → `master`** so landed work is always on `master` too. Do not leave finished task merges only on the integration branch.
6. Resolve any merge conflicts on the PR before merging. Do not start the next task PR until this task’s integration merge **and** the `master` promote are done.
7. Update `.superpowers/sdd/progress.md` with branch name, commit range, task PR URL, master promote PR URL, and merge SHAs.

Parallel **coding** is fine. Parallel **PRs landing** is not. Do not open-and-merge several task PRs in one batch.

Order for this foundation plan after Task 3:

```
PR+merge task-4-chassis
then PR+merge task-5a-wheel-ultrasonic
then task-5b-registry (new branch off updated integration)
then task-6 → task-7 → task-8
```

## Progress ledger

Path: `.superpowers/sdd/progress.md` (under `.superpowers/`, gitignored).

Before dispatch, read the ledger. Do not re-dispatch completed tasks.

After a clean review and PR merge:

```
Task N: complete (branch feat/task-N-..., commits <base7>..<head7>, PR <url>, merged <sha>, review clean)
```

## Dispatch

Use `subagent_type: "generalPurpose"` (or `poteto-agent` if available) for implementers and fixers.

**Models:** Grok orchestrates (controller). Implementers and fixers run on **composer 2.5** (`composer-2.5-fast`). Do not inherit the orchestrator model for coding subagents.

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

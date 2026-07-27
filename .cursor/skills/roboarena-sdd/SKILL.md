---
name: roboarena-sdd
description: How to execute RoboArena implementation plans with subagent-driven development in this repo. Use when running SDD, dispatching plan tasks, or resuming after compaction.
---

# RoboArena SDD

## Workspace

Never commit product work on `master`. Use `.worktrees/` for isolation.

## Branch graph (required)

Every plan task (and every parallel component slice) gets its **own branch**.

Naming:

```
feat/task-<N>-<short-slug>
feat/task-<N>a-<short-slug>   # parallel slice
```

Examples: `feat/task-2-partdef-palette`, `feat/task-4-chassis`, `feat/task-5a-wheel`.

Base off current `master`, **or** off a parent task branch tip when you depend on work that is pushed but not yet merged (stacked branches). Implementers do not commit on `master`.

## Granular commits (required)

One logical change per commit. A single task usually produces **multiple** commits, for example:

1. failing test
2. minimal implementation that passes
3. follow-up polish only if needed

Never squash a whole task into one commit unless the user asks.

Author every commit as Troy-LL per `roboarena-engineering` (including GMT+8 stamps).

## Dependency DAG and parallel waves

Schedule from the plan’s file dependencies, not from task number alone.

- **Serial spine:** shared types, cache, package scaffolding (one writer).
- **Parallel wave:** disjoint files only (e.g. wheel vs ultrasonic). Two worktrees or two branches off the same base.
- **Join task:** registry / wiring / budget tests after the parallel branches are **pushed** (branch the join off the needed parent tips; do not merge to `master` just to unblock).

Never run two implementers that write the same path at once.

## Phase A — push all branches first (required)

**Do not merge a task as soon as it finishes.** For the current plan wave:

1. Implement + granular commits on the task branch only.
2. Push: `git push -u origin HEAD`.
3. Optionally open a **draft** PR into `master` for later review — leave it unmerged.
4. Update ledger: `Task N: pushed (branch …, commits …, PR <url or none>, awaiting batch merge)`.
5. Continue the next task.

## Phase B — merge to master one-by-one (only after the wave is done)

When **all** task branches for the wave are pushed and review-clean:

1. Merge into `master` **one PR/branch at a time**, in dependency order.
2. Resolve conflicts on that merge before starting the next.
3. Parallel landing is forbidden.
4. Update the ledger with merge SHAs after each merge.

Never local-merge task branches into `master`. Never open-and-merge several task PRs in one batch.

Order for remaining foundation work (push all first; merge only in Phase B):

```
push task-5b-registry
push task-6 → task-7 → task-8
then Phase B: merge 5b → 6 → 7 → 8 into master, one at a time
```

(Tasks 1–5a already merged under the old immediate-merge rule; do not rewrite that history.)

## Progress ledger

Path: `.superpowers/sdd/progress.md` (under `.superpowers/`, gitignored).

Before dispatch, read the ledger. Do not re-dispatch completed tasks.

After push (Phase A):

```
Task N: pushed (branch feat/task-N-..., commits <base7>..<head7>, PR <url or none>, awaiting batch merge)
```

After Phase B merge:

```
Task N: merged to master (PR <url>, merge <sha>, review clean)
```

## Dispatch

Use `subagent_type: "generalPurpose"` (or `poteto-agent` if available) for implementers and fixers.

**Models:** Grok orchestrates (controller). Implementers and fixers run on **composer 2.5** (`composer-2.5-fast`). Do not inherit the orchestrator model for coding subagents.

Each implementer prompt must include:

- base SHA / branch to create from
- their exclusive file paths
- “granular commits, not one commit for the whole task”
- “do not commit on master”
- “push only — do not merge; controller batches merges in Phase B”

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

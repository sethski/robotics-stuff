---
name: roboarena-sdd
description: How to execute RoboArena implementation plans with subagent-driven development in this repo. Use when running SDD, dispatching plan tasks, or resuming after compaction.
---

# RoboArena SDD

Git/branching matches global `~/.claude/CLAUDE.md` and always-on rule `.cursor/rules/roboarena-sdd-workflow.mdc`. On conflicts, prefer those over older notes in this skill.

## Workspace

Never commit product work on `master`. Prefer `.worktrees/` for isolation when running SDD. Check the current branch before creating a new one — reuse if the user is already on the right task branch.

## Branch graph

**Branch per task/phase, not per component.** One branch covers a whole plan task (or phase), spanning however many components it touches. Do not spawn a branch per file or per sub-component.

Naming when creating a branch:

```
feat/task-<N>-<short-slug>
feat/<phase>-<short-slug>
```

Examples: `feat/task-1-robot-design`, `feat/task-4-remaining-parts`.

- Reuse before creating: check current branch and existing task branches first.
- Base off current `master`, **or** a parent task branch tip when stacked on unfinished sibling work.
- **Small work doesn't get a branch** (typo, one-liner, tweak on 1–2 files) — commit on the current branch, except when that branch is `master` / `main` (then branch first).
- Implementers do not commit on `master`.
- Never add `Co-Authored-By` (or any AI co-author) lines.

## Commits

**Commit by logical chunk**, not per-component and not a mechanical RED → GREEN → polish split. Group related changes that belong together — even across files. Split only when changes are genuinely independent. Each commit should stand alone with a clear message. Not one end-of-task dump.

Author every commit as Troy-LL per `roboarena-engineering` (including GMT+8 stamps).

## Dependency DAG and parallel waves

Schedule from the plan’s file dependencies, not from task number alone.

- **Serial spine:** shared types, cache, package scaffolding (one writer).
- **Parallel wave:** independent **tasks** with disjoint files. Cut multiple branches from the same base at once; two worktrees OK.
- **Join task:** registry / wiring / budget after parallel task branches are **done and pushed** (stack the join off parent tips; do not merge to `master` just to unblock unless the user asks).

Never run two implementers that write the same path at once.

## Push and land

**Push once per task/phase by default.** Commit as you go; push when the task is done (`git push -u origin HEAD`). Push mid-work only when needed (user asks, or teammates need the remote). Don’t leave a finished task unpushed.

**PR/merge to `master` is never automatic.** Always ask before opening a PR or merging.

For a multi-task plan wave:

1. Develop each task on its branch; push when that task is done.
2. Update the ledger (see below).
3. When the wave is ready and the user confirms: land **one branch at a time** into `master`, dependency order. No parallel merges.
4. Do not merge mid-wave just to unblock unless the user asks.

Never local-merge task branches into `master` without confirmation. Never open-and-merge several task PRs in one batch.

## Progress ledger

Path: `.superpowers/sdd/progress.md` (under `.superpowers/`, gitignored).

Before dispatch, read the ledger. Do not re-dispatch completed tasks.

After a task is pushed:

```
Task N: pushed (branch feat/task-N-..., commits <base7>..<head7>, PR <url or none>, awaiting user confirm to merge)
```

After a confirmed merge:

```
Task N: merged to master (PR <url>, merge <sha>, review clean)
```

## Dispatch

Use `subagent_type: "generalPurpose"` (or `poteto-agent` if available) for implementers and fixers.

**Models:** Orchestrator reviews / PRs / merges / dispatch. Implementers and fixers run on **composer 2.5** (`composer-2.5-fast`). Do not inherit the orchestrator model for coding subagents.

Each implementer prompt must include:

- base SHA / branch to create from (or “use current branch …” if already checked out)
- their exclusive file paths
- “commit by logical chunk; no AI co-author; Troy-LL + GMT+8”
- “do not commit on master”
- “push when the task is done — do not open a PR or merge; controller asks the user first”

Hand requirements as a brief file. Report path in the prompt. Chat return is status only.

## Plans

- Foundation (done): `docs/superpowers/plans/2026-07-26-part-system-and-rendering-foundation.md`
- Build mode (current): `docs/superpowers/plans/2026-07-26-build-mode-and-remaining-parts.md`

Global constraints in the active plan bind every task. Execution order notes in the plan (e.g. parts before pin tests) override task-number order.

## Code navigation

Prefer CodeGraph when `.codegraph/` exists (`codegraph_explore` / `codegraph explore`). Otherwise Grep/Glob/Read. Never assume a `code-review-graph` MCP. See the always-on rule for the full CodeGraph section.

## Ecosystem skills (project-local)

Installed via [find-skills](https://www.skills.sh/vercel-labs/skills/find-skills):

| Skill | Use when |
|---|---|
| `find-skills` | Searching for more skills with `npx skills find` |
| `react-three-fiber` | R3F / drei scene work |
| `3d-web-experience` | Broader WebGL / 3D UX patterns |
| `vite-patterns` | Vite config and app scaffold |
| `vitest-testing` | Writing or debugging Vitest suites |

Prefer these over reinventing stack guidance. `roboarena-engineering` wins on conflicts.

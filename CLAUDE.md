# RoboArena — Claude / agent instructions

This file is the **project** override. When working in this repo, it wins over global `~/CLAUDE.md` / `~/.claude/CLAUDE.md` on conflicting git workflow advice.

## Identity

Commit as **Troy-LL** (`Troy-LL@users.noreply.github.com`) for both author and committer. Never add `Co-Authored-By`.

## Delivery workflow (required)

Cursor always-on rule: `.cursor/rules/roboarena-sdd-workflow.mdc`  
Skill: `.cursor/skills/roboarena-sdd/SKILL.md`

Summary:

1. Integration branch for merges only (`feat/part-system-foundation` for the foundation plan).
2. One branch per task / component slice (`feat/task-N-slug`).
3. Granular commits on that branch (test → implement → polish).
4. Push the task branch, open a **PR into the integration branch**, review, merge via the PR.
5. One PR at a time. Parallel coding on disjoint files is fine; parallel merges are not.

Never local-merge task branches into integration. Never land product work on `master` without an explicit ask.

## Engineering

See `AGENTS.md` and `.cursor/skills/roboarena-engineering/SKILL.md`:

- Search open source before writing from scratch.
- No imported 3D models / zero part asset bytes.
- Parts are `PartDef` pure functions; call `buildPart` only.

## Plans and specs

- Spec: `docs/superpowers/specs/2026-07-26-roboarena-visual-fidelity-and-app-shell-design.md`
- Plan: `docs/superpowers/plans/2026-07-26-part-system-and-rendering-foundation.md`
- SDD ledger: `.superpowers/sdd/progress.md` (gitignored)

## Code navigation

Prefer CodeGraph when `.codegraph/` exists. Otherwise Grep/Glob/Read.

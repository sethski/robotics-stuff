# RoboArena — Claude / agent instructions

This file is the **project** override. When working in this repo, it wins over global `~/CLAUDE.md` / `~/.claude/CLAUDE.md` on conflicting git workflow advice.

## Identity

Commit as **Troy-LL** (`Troy-LL@users.noreply.github.com`) for both author and committer. Never add `Co-Authored-By`. Stamp commit times in **GMT+8 (`+0800`)**, not Pacific — see `.cursor/skills/roboarena-engineering/SKILL.md`.

## Delivery workflow (required)

Cursor always-on rule: `.cursor/rules/roboarena-sdd-workflow.mdc`  
Skill: `.cursor/skills/roboarena-sdd/SKILL.md`

Summary:

1. One branch per task / component slice (`feat/task-N-slug`).
2. Granular commits on that branch (test → implement → polish), GMT+8 stamps.
3. **Phase A:** push every task branch (draft PRs OK). **Do not merge yet.**
4. **Phase B:** only after the whole plan wave is pushed — merge into `master` **one branch at a time**, dependency order.
5. Parallel coding on disjoint files/worktrees is fine; parallel merges are not.

Never commit product work directly on `master`. Never merge mid-wave just because one task finished.

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

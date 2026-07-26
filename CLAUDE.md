# RoboArena — Claude / agent instructions

Git/branching follows global `~/.claude/CLAUDE.md`. Cursor always-on rule `.cursor/rules/roboarena-sdd-workflow.mdc` carries that plus repo identity. This file adds RoboArena engineering context only — it does **not** override global git rules.

## Identity

Commit as **Troy-LL** (`Troy-LL@users.noreply.github.com`) for both author and committer. Never add `Co-Authored-By`. Stamp commit times in **GMT+8 (`+0800`)**, not Pacific — see `.cursor/skills/roboarena-engineering/SKILL.md`.

## Delivery workflow (required)

Cursor always-on rule: `.cursor/rules/roboarena-sdd-workflow.mdc`  
Skill: `.cursor/skills/roboarena-sdd/SKILL.md`

Summary (matches global):

1. Branch per **task/phase** (not per component); check current branch before creating; small work stays on current branch (except on `master`).
2. Commit by **logical chunk**; push once per task/phase by default; GMT+8 stamps.
3. Parallel coding on disjoint files/worktrees is fine; land merges **one at a time** after asking.
4. **Never** open a PR or merge to `master` without explicit confirmation.
5. Never commit product work directly on `master`.

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

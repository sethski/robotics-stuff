# Project agent notes — RoboArena

## Git

Commit as GitHub username **Troy-LL** (`Troy-LL <Troy-LL@users.noreply.github.com>`).
This machine has no global git identity set; pass it per-command with
`git -c user.name=... -c user.email=... commit` rather than writing to git config.

Stamp every commit in **GMT+8 (`+0800`)** via `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` (this Windows box is Pacific; do not use local TZ). Recipe: `.cursor/skills/roboarena-engineering/SKILL.md`.

Never add a `Co-Authored-By` line.

### Branches, commits, merges

- One **branch per plan task / component slice** (`feat/task-N-slug`). Do not commit product work on `master` or directly on the integration branch.
- **Granular commits** inside each branch (test → implement → polish). Not one commit per task.
- **Parallel coding** only on disjoint files (dependency DAG).
- **Landing:** push the task branch, open a **PR into the integration branch**, review it, then **merge through that PR**. Never local-merge task branches. One PR at a time.
- Full procedure: `.cursor/skills/roboarena-sdd/SKILL.md`
- Always-on Cursor rule: `.cursor/rules/roboarena-sdd-workflow.mdc`
- Project Claude override: `CLAUDE.md` (wins over global Claude instructions for this repo)

## Standing engineering rules

**Search open source first.** For every capability, look for an existing library before writing it
from scratch. Only build it ourselves when nothing fits, and record the search and the verdict in
the relevant spec (see the search log in
`docs/superpowers/specs/2026-07-26-roboarena-visual-fidelity-and-app-shell-design.md` §2).

**No imported 3D models.** All part geometry is generated procedurally in Three.js. Zero asset
bytes is a hard constraint; see PRD §7.1a.

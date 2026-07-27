# Project agent notes — RoboArena

## Git

Commit as GitHub username **Troy-LL** (`Troy-LL <Troy-LL@users.noreply.github.com>`).
This machine has no global git identity set; pass it per-command with
`git -c user.name=... -c user.email=... commit` rather than writing to git config.

Stamp every commit in **GMT+8 (`+0800`)** via `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` (this Windows box is Pacific; do not use local TZ). Recipe: `.cursor/skills/roboarena-engineering/SKILL.md`.

Never add a `Co-Authored-By` line.

### Branches, commits, merges

- One **branch per plan task / component slice** (`feat/task-N-slug`). Do not commit product work on `master`.
- **Granular commits** inside each branch (test → implement → polish). Not one commit per task.
- **Parallel coding** only on disjoint files (dependency DAG).
- **Phase A:** push all task branches (draft PRs OK). Do **not** merge as each task finishes.
- **Phase B:** when the whole wave is done, merge into `master` **one branch at a time** (dependency order).
- Full procedure: `.cursor/skills/roboarena-sdd/SKILL.md`
- Always-on Cursor rule: `.cursor/rules/roboarena-sdd-workflow.mdc`
- Project Claude override: `CLAUDE.md`

## Standing engineering rules

**Search open source first.** For every capability, look for an existing library before writing it
from scratch. Only build it ourselves when nothing fits, and record the search and the verdict in
the relevant spec (see the search log in
`docs/superpowers/specs/2026-07-26-roboarena-visual-fidelity-and-app-shell-design.md` §2).

**No imported 3D models.** All part geometry is generated procedurally in Three.js. Zero asset
bytes is a hard constraint; see PRD §7.1a.

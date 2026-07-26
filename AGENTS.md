# Project agent notes — RoboArena

## Git

Commit as GitHub username **Troy-LL** (`Troy-LL <Troy-LL@users.noreply.github.com>`).
This machine has no global git identity set; pass it per-command with
`git -c user.name=... -c user.email=... commit` rather than writing to git config.

## Standing engineering rules

**Search open source first.** For every capability, look for an existing library before writing it
from scratch. Only build it ourselves when nothing fits, and record the search and the verdict in
the relevant spec (see the search log in
`docs/superpowers/specs/2026-07-26-roboarena-visual-fidelity-and-app-shell-design.md` §2).

**No imported 3D models.** All part geometry is generated procedurally in Three.js. Zero asset
bytes is a hard constraint; see PRD §7.1a.

---
name: ship
description: Verify and ship finished work in this repo — build, both test suites, typecheck, lint, the fuzzer, the Playwright smoke suite when the UI changed, the scenario gate when the bots changed, a CRLF/LF drift check, docs (BACKLOG, CLAUDE.md, the plan) — then commit in logical pieces and push to origin/main. Use when the user says ship it, commit, push, wrap up, or asks to check everything before committing.
---

# Ship

The standing authorization (CLAUDE.md, "Git workflow") is to commit and push
to `origin/main` once work is **verified**. This is that verification, in the
order that fails fastest. Stop at the first failure and report it with its
output — never ship past one.

## 1. Verify (one call, in the background — it takes a while)

```bash
cd "$(git rev-parse --show-toplevel)" && npm run -s verify
```

`scripts/verify.mjs` runs, fastest-failing first: gen:cards, the build, the
backlog re-marks, typecheck + lint, the engine suite then server + client,
the test files you added type-checked, card:verify (offline), and side by
side the fuzzer at 2 and 4 players, the fuzzer with every pool card the
change adds forced in (`-- --with "Name"` adds more), and the bot gate. It
prints one line per step and a log path for a failure. `-- --skip
fuzz,gate` and the like for a docs-only or client-only change.

Report the test counts; they should only go up (fewer means a file was
clobbered). If the build rewrote `generated.ts` or `shards/`, commit them.

## 2. What else the change needs

- **Engine behaviour or cards**: covered by step 1 (both fuzzer table sizes,
  the new cards forced in).
- **Bots** (`engine/src/bot/`, `controller.ts`, weights): the gate is in step
  1 and must stay all-pass. A change in
  strength wants `ab-bench` or `decision-diff`; say which was run, or that
  neither was and why.
- **Anything UI-visible**: `npm run test:e2e -w client`, and a look in the
  browser at a 2- and a 4-player table at ~768px tall (`dev-up`, then
  `dev-down` after). `client/CLAUDE.md`'s standing UI rules apply.
- New test: break the code it covers and watch it fail, where a silent pass
  is plausible.

## 3. Line endings

Windows edits can leave a file half CRLF. For each modified file,
`git diff --stat` should look proportionate to the edit; if one doesn't:
`git cat-file -p HEAD:<path> | grep -c $'\r'` against its line count, and fix
with `sed -i 's/\r$//' <path>` — **never on `engine/src/game.ts`** (binary to
git on purpose; edit it with the Edit tool, which keeps its CRLF and NUL).

## 4. Docs, in the same commit as the work

- `BACKLOG.md`: delete the line for what landed; add one for anything found
  and left.
- `CLAUDE.md` (root or the workspace's) for a new invariant, command or doc, and the file's entry in `docs/architecture/<workspace>.md` for new files, flags or architecture.
- A plan in `docs/plans/` the work belongs to: its progress entry.

## 5. Commit and push

Split unrelated work into separate commits the way `git log` does ("Bots:
…", "Engine: …", "Client: …", "Cards: …"). Message: what changed and why,
with the numbers that justify it, ending with the attribution lines the
session gives. Then `git push origin main` (a cloud session pushes its
`claude/…` branch instead). No force-push, no history rewrite, no
`--no-verify`, ever without asking.

## 6. Report

A few lines: the commits (hash + subject), what was verified, and anything
skipped and why.

---
name: ship
description: Verify and ship finished work in this repo — build, both test suites, typecheck, lint, the fuzzer, the Playwright smoke suite when the UI changed, the scenario gate when the bots changed, a CRLF/LF drift check, docs (BACKLOG, CLAUDE.md, the plan) — then commit in logical pieces and push to origin/main. Use when the user says ship it, commit, push, wrap up, or asks to check everything before committing.
---

# Ship

The standing authorization (CLAUDE.md, "Git workflow") is to commit and push
to `origin/main` once work is **verified**. This is that verification, in the
order that fails fastest. Stop at the first failure and report it with its
output — never ship past one.

## 1. Build and check (one call)

```bash
cd "$(git rev-parse --show-toplevel)" || exit 1
npm run build > "$TEMP/ship-build.txt" 2>&1 || { echo BUILD FAILED; tail -30 "$TEMP/ship-build.txt"; exit 1; }
npm run typecheck > "$TEMP/ship-tc.txt" 2>&1 || { echo TYPECHECK FAILED; tail -30 "$TEMP/ship-tc.txt"; exit 1; }
npm run lint > "$TEMP/ship-lint.txt" 2>&1 || { echo LINT FAILED; tail -30 "$TEMP/ship-lint.txt"; exit 1; }
npm test > "$TEMP/ship-test.txt" 2>&1; r=$?; grep -E "Test Files|Tests |FAIL|×" "$TEMP/ship-test.txt"; [ $r -eq 0 ] || exit 1
git status --short | grep -E "generated\.ts|shards/" && echo "BUILD REWROTE GENERATED FILES — commit them"
```

Report the test counts; they should only go up (fewer means a file was
clobbered).

## 2. What else the change needs

- **Engine behaviour or cards**: the fuzzer, both table sizes —
  `node engine/scripts/random-demo.mjs --games 60` and
  `--games 40 --players 4` (it runs `dist`, built in step 1). A card:
  `-- --with "Card Name"` too.
- **Bots** (`engine/src/bot/`, `controller.ts`, weights): `npm run
  bot:scenarios -w engine` — the gate must stay all-pass. A change in
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
git on purpose; edit it with byte-preserving tools only).

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

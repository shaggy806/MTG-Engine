# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MTG-Engine is a Magic: The Gathering rules engine (`engine/`) with an authoritative multiplayer
room server (`server/`) and a React web client (`client/`) — a real networked 2-4 player game
(Commander-capable), not a local hot-seat demo. The repo is an **npm workspaces monorepo**
(`workspaces: ["engine", "protocol", "server", "client"]` in the root `package.json`, in
that order so `engine` builds first, then `protocol`, then `server`).

- `engine/` — the rules engine: a pure TypeScript state machine driven through `Game.dispatch`,
  no I/O, no UI. **`engine/CLAUDE.md`** holds its invariants.
- `protocol/` — types only: the wire contract between `server` and `client`, imported by both.
  Emits no runtime code.
- `server/` — Node + `ws`: the room host, one real `Game` per room, each seat pushed its own
  redacted view. **`server/CLAUDE.md`**.
- `client/` — Vite + React 19: a networked client, one device per seat, never running a `Game`
  itself. Needs `engine/dist` and `protocol/dist` built. **`client/CLAUDE.md`**.

Each workspace's `CLAUDE.md` loads when you work in it. The full per-file detail behind them is
in **`docs/architecture/engine.md`, `server.md` and `client.md`**: not loaded automatically, so
read the entry for a file before changing that file. When a file's shape changes, update its
entry there (and the workspace `CLAUDE.md` if an invariant changed) in the same commit.

## Where the docs live

These files are a map of *current architecture*, not a changelog. The others, and what each is
for:

- **`BACKLOG.md`** — **the plan of record for open work**: one line per thing still to do
  (commander gap, card backlog, engine rules gaps, bots, client/UI, tooling), each pointing at
  where its detail lives. Delete a line when it lands; add one when you find something. Nothing
  else lists open work, so check it before starting and update it in the same commit.
- **`ROADMAP.md`** — the engine's build history, condensed. Its 11 phases and the follow-on
  "needed-cards" P0–P20 passes are **all done**; ~180 source comments cite "ROADMAP Phase N", so
  the phase index stays. **Read its *Architecture constraints* section before touching the
  engine.** Per-phase narrative detail is in `git log`, not here.
- **`engine/src/cards/neededCards-features.md`** — the detail behind `BACKLOG.md`'s engine items:
  engine features ranked by how many real cards each would unblock, over two measured
  populations, plus a compact index of finished passes (P0–P20, Tier 1, E1–E3) that source
  comments cite. **The commander gap comes first**: `top-commanders.txt` (`npm run cmdrs:top` /
  `cmdrs:mark -w engine`) is the top 500 commanders by decks run *as commander* — ranking them by
  card popularity misses 53 of the top 100, because a commander is a singleton played almost
  nowhere but its own deck — and `top-commanders-gaps.json` maps every unimplemented one to the
  engine features it needs (a per-card triage over one ~245-feature vocabulary), which
  `npm run cmdrs:gaps -w engine` ranks by commanders blocked and as a greedy engine-only build
  order. Add a feature's key to the JSON's `built` array when it lands. The card backlog is
  `top-commander-cards.txt` (the top 5000 Commander cards by
  EDHREC rank against the pool, ahead of more commanders), re-marked in place by `npm run cards:mark -w engine`.
  **The current authoring priority comes before both:** the stand-ins left in the bots' decks —
  the substitution tables in `engine/src/sample-decks.ts` (and `docs/plans/precon-decks.md`).
  The five Tarkir: Dragonstorm precons, the default decks, have none since 2026-10-09; the nine
  other starter precons' are next. The pool is
  ~5,400 real cards (`npm run card:verify -w engine` prints the current count of definitions,
  which is a little higher: each face of a double-faced card is its own).
- **`docs/manual-checks.md`** — the cards worth checking by hand in a live game: a new player
  decision or a careful rules call, each with a setup, what to do and what to look for. Each
  authoring pass adds entries for what it introduces, each with a loadable board in
  `client/src/builder/manualChecks.ts` (the scenario builder's Manual checks list; a server test
  insists every entry has one); an entry is deleted once it checks out.
- **`docs/card-blockers.md`** — reference, not a to-do list: what blocks the unimplemented cards,
  batch by batch (top-5000 batches, the TDC precons, card sweep 2) and by family, indexing the
  per-card JSON records in `engine/data/sweep-2/` and `sweep-3/` — their needs keyed on one
  vocabulary (`engine/data/needs-vocabulary.json` beside the gaps file's features; `npm run
  cards:needs -w engine` ranks them and lists what's been built since). Batch summaries go here, and
  so do card lists (which cards wait on a feature, which a built one may have unblocked): its
  "Open leads" section holds them, and `BACKLOG.md` points at it rather than listing cards.
- **`docs/bot-misplays.md`** — bot misplays the user saw on the live site without a capture, each rebuilt as a training scenario by the `bot-misplay` skill, with why the bot chose it and the likely fix.
- **`docs/engine-gaps.md`** and **`docs/client-gaps.md`** — the detail behind `BACKLOG.md`'s
  "Engine rules gaps" and "Client / UI" items (rule numbers, code sites, blocked cards), under
  the same bold titles; `BACKLOG.md` keeps one line each. Add or delete an item in both.
- **`engine/src/cards/AUTHORING.md`** — the hand-authoring guide for adding a card. Read before
  authoring.
- **`DEPLOYMENT.md`** — the deckblitz.net (AWS Lightsail) production hosting/update runbook.
- **`docs/rules/MagicCompRules_20260925.txt`** — the Comprehensive Rules, effective 2026-09-25
  (Wizards' text, unedited). Grep it for a rule's number and wording before citing one in code, a
  comment or a commit; when a newer edition is added, replace the file and this line.
- **`docs/plans/*.md`** — design records, each saying *why* its piece is shaped the way it is,
  with a `Status:` line at the top. `docs/plans/README.md` indexes them. Two are **in
  progress**: `bot-effect-knowledge` (the plan of record for the bots — read it before changing
  how a bot picks actions) and `token-stack-choices`.
- **`client/BOARD_REDESIGN_PLAN.md`** — the board-overhaul record: the mockup URL, the settled
  design rules, and the known gaps. All 18 phases shipped.

## Commands

Run from the repo root unless noted. Workspace scripts: `npm run <script> -w engine` / `-w server` / `-w client`.
Each workspace's `CLAUDE.md` lists its everyday commands; `docs/architecture/*.md` has all of
them in full.

**Whole repo** (root scripts fan out with `--workspaces --if-present`):
- `npm run build` — builds `engine` (tsc), then `server` (tsc), then `client` (`tsc -b && vite build`)
- `npm test` — runs `engine`, `server` and `client` vitest, each once (the client's Playwright suite is separate: `npm run test:e2e -w client`)
- `npm run lint` — oxlint on `client`
- `npm run typecheck` — `tsc --noEmit` on `engine`, `tsc --noEmit` on `server`, `tsc -b` on `client`
- `npm run verify [-- --with "Card"] [-- --skip fuzz,gate]` — everything a change must pass, fastest-failing first (`scripts/verify.mjs`): gen:cards, build, the backlog re-marks, typecheck + lint, the three suites, the test files you added type-checked (vitest never does), card:verify offline, then the fuzzer at 2 and 4 players, the fuzzer with every card the change adds forced in, and the bot gate, side by side. Logs per step in the OS temp dir.

Local servers: the `dev-up` / `dev-down` skills start and stop the room server (or `dev-rooms`,
preloaded test boards) and Vite. Scripts and the fuzzer run `dist/`, so build before running them.

## Git workflow

- **Standing authorization to commit and push**: once a feature is working (build/lint/typecheck/tests clean, and — for anything UI-visible — checked live in the browser), commit it and push to `origin/main` without asking first each time. Split unrelated work into separate, logically-scoped commits the way the existing history does (see `git log`), rather than one giant commit. This still doesn't cover force-push, history rewrites, or pushing something you haven't actually verified — those still warrant asking.
- **CI** (`.github/workflows/ci.yml`) runs on every pull request and every push to `main`: `npm ci`, the full build, a check that the build left no generated file uncommitted (the engine's prebuild rewrites `cards/generated.ts`), typecheck, lint, both test suites, and a short 2- and 4-player fuzzer pass.
- **Cloud sessions** (Claude Code on the web) start from a bare clone with no `node_modules`, and push to a `claude/…` branch rather than `main`. `.claude/hooks/session-start.mjs`, registered as a SessionStart hook in `.claude/settings.json`, installs dependencies and builds engine, protocol and server before the session starts. It's Node rather than bash because a CRLF checkout breaks a shell script, and it does nothing outside a cloud session.

## Toolchain notes

- **Module systems differ**: `engine`/`server` are ESM + NodeNext, so their own relative imports need explicit `.js` extensions (e.g. `import { x } from "./foo.js"` even though the file is `foo.ts`). `client` is ESM + bundler mode.
- **Engine/server TS config is `erasableSyntaxOnly`** (same as the client): **no `enum`, no `namespace`, no constructor parameter properties**. Use string-literal unions + `as const satisfies` tables instead. Also `verbatimModuleSyntax` → split `import type { … }` from value imports. `strict` + `noUnusedLocals`/`noUnusedParameters`.
- **Client TS config** (`client/tsconfig.app.json`) is strict bundler-mode: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`/`noUnusedParameters`, `allowImportingTsExtensions` (relative imports include the `.tsx`/`.ts` extension). `noEmit` — Vite does the transform.
- **Engine/server tsconfig excludes `src/**/*.test.ts`** from the build; vitest type-checks tests itself.
- **`package-lock.json` is written by npm 11.** npm 10 drops the `libc` fields npm 11 records for platform-specific optional packages, so changing dependencies with npm 10 churns the lockfile. Where the installed npm is older (the cloud sessions' image has 10.9), use `npx npm@11 install …`.
- **Shared dev deps are hoisted to the root** `package.json` (`typescript`, `@types/node`). Don't re-add them to a workspace unless a version needs to diverge.
- **Lint** is oxlint, not ESLint. Config in `client/.oxlintrc.json` (`react`, `typescript`, `oxc` plugins; `react/rules-of-hooks` errors).
- Assets in `client/public/` are referenced by absolute path (e.g. `/favicon.svg`); assets imported from `src/` go through Vite.
- **`game.ts` reads as *binary* to git and grep.** It contains a literal NUL byte — the `"\0none"` sentinel at the `chosenCreatureType` fallback, written as a raw byte rather than the escape — so a plain `grep` over it reports "Binary file matches" and finds nothing. **Use `grep -a`** (the Grep tool hits this too). Don't remove the byte casually: with `core.autocrlf=true` and no `.gitattributes`, being binary is the only reason git stores that file verbatim, and making it text normalises CRLF→LF across all ~10,100 lines in one commit, taking `git blame` with it. See `docs/plans/decision-registry.md`. **Edit it with the Edit tool**, which keeps its CRLF and the NUL byte (checked 2026-10-09) — not a script's text-mode rewrite. To check endings, count bytes (`python -c` over `open(f,'rb')`) or read `git diff` through `cat -A`: Git Bash's `sed`, `grep` and `wc` hide the CRs.
- **Windows CRLF/LF drift**: editing an existing pure-LF source file on Windows can leave it with *mixed* line endings (untouched lines stay LF, lines the tool rewrites come out CRLF) — distinct from a file that's already consistently CRLF (harmless). Before committing, if `git diff --stat` on an edited file looks disproportionate to the actual edits, check directly (`git cat-file -p HEAD:<path> | grep -c $'\r'` vs total line count) rather than trusting the diff size. Fix with `sed -i 's/\r$//' <path>`, rebuild/retest, then fold the fix into the same commit via `git commit --amend` if nothing's been pushed yet.

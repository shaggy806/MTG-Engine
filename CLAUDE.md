# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MTG-Engine is a Magic: The Gathering rules engine (`engine/`) with a
React web client (`client/`). The repo is an **npm workspaces monorepo** (`workspaces:
["engine", "client"]` in the root `package.json`, in that order so `engine` builds first).

- `engine/` — a TypeScript library package, ESM (`"type": "module"`), NodeNext resolution. Emits to `dist/` with declarations; `package.json` `exports`/`main`/`types` point there.
- `client/` — a working Vite + React 19 + TypeScript app (still the starter template UI in `src/App.tsx`). Declares `engine` as a dependency (`"engine": "*"`, resolved via the workspace symlink) but does not import it yet.

## Engine architecture (`engine/src/`)

The engine is at **milestone 1**: the game-state model and turn engine. Nothing is
castable yet — there is no stack, and the only external action is passing priority.

- **`state.ts`** — `GameState` is one plain, `structuredClone`-able tree (no class instances, `Map`/`Set`, or functions inside it). Holds players, `objects` (card instances), `zones` (`perPlayer` library/hand/graveyard + `shared` battlefield/stack/exile/command as ordered `ObjectId[]`), `turn`, `priority`, `result`, and the `eventLog`. Also exports pure selectors.
- **`game.ts`** — `Game` owns the single mutable `GameState` and is the **only** writer. `Game.create(config)` sets up a 2-player game (seeded shuffle, opening hands). `dispatch(action)` applies an external action; `advance()` / `advanceUntil(pred)` run the automatic loop (`tick()`): state-based actions → pass priority if held → else `endStep()`. Every mutation goes through `emit()` which appends a `GameEvent`.
- **`turn.ts`** — `Phase`/`Step` as string-literal unions (no `enum`; see toolchain notes), `TURN_SEQUENCE`, `PHASE_OF_STEP`, `nextStep`, `stepUsesPriority` (false only for untap/cleanup).
- **`events.ts`** — discriminated `GameEvent` union (the audit log; basis for future replay/netcode). `emit()` takes `GameEventInput` (no `seq`).
- **`cards.ts`** — `CardDefinition` is **declarative** (printed characteristics) with an imperative `CardScript` escape hatch for later. `CardRegistry` resolves a card name → definition; `createDefaultRegistry()` has the M1 pool (basic lands + Grizzly Bears). `GameObject.cardName` is the registry key, so the registry is environment, not serialized state.
- **`controller.ts`** — `PlayerController` supplies player decisions (M1: only `chooseDiscards`). `AutomaticController` is the deterministic default.
- **`primitives.ts`** — branded `PlayerId`/`ObjectId`, seeded `Rng` (mulberry32; `rng.seed` fully describes stream position for snapshotting), `shuffle`.

Snapshot/restore: `game.snapshot()` → `structuredClone(state)`; `Game.fromSnapshot(snap, env)` rebuilds (re-supply `registry`/`controllers` via `env`). Determinism: same seed + same controllers ⇒ identical replay.

## Commands

Run from the repo root unless noted. Workspace scripts: `npm run <script> -w engine` / `-w client`.

**Whole repo** (root scripts fan out with `--workspaces --if-present`):
- `npm run build` — builds `engine` (tsc) then `client` (`tsc -b && vite build`)
- `npm test` — runs `engine` vitest once (`client` has no tests)
- `npm run lint` — oxlint on `client`
- `npm run typecheck` — `tsc --noEmit` on `engine`, `tsc -b` on `client`

**Engine** (`engine/`):
- `npm run test -w engine` — vitest, single pass (CI mode)
- `npm run test:watch -w engine` — vitest watch mode
- `npm run test -w engine -- path/to/file.test.ts` — run one test file
- `npm run test -w engine -- -t "name"` — run tests matching a name
- `npm run build -w engine` — `tsc` → `engine/dist/`
- `npm run typecheck -w engine` — `tsc --noEmit`
- `npm run play -w engine` — builds, then runs `engine/scripts/play.mjs`: plays a two-player game and prints its event log. Flags: `-- --seed 7`, `-- --turns 3` (stop before that turn). The engine has no UI, so this and the tests are how you watch it run.

A git-ignored `scratch.mjs` at the repo root is a scratch pad for ad-hoc exploration (`node scratch.mjs` after `npm run build -w engine`).

**Client** (`client/`):
- `npm run dev -w client` — Vite dev server with HMR
- `npm run build -w client` — type-check (`tsc -b`) then `vite build`
- `npm run lint -w client` — oxlint
- `npm run preview -w client` — serve the production build

## Toolchain notes

- **Module systems differ**: `engine` is ESM + NodeNext, so its own relative imports need explicit `.js` extensions (e.g. `import { x } from "./foo.js"` even though the file is `foo.ts`). `client` is ESM + bundler mode.
- **Engine TS config is `erasableSyntaxOnly`** (same as the client): **no `enum`, no `namespace`, no constructor parameter properties**. Use string-literal unions + `as const satisfies` tables instead. Also `verbatimModuleSyntax` → split `import type { … }` from value imports. `strict` + `noUnusedLocals`/`noUnusedParameters`.
- **Client TS config** (`client/tsconfig.app.json`) is strict bundler-mode: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`/`noUnusedParameters`, `allowImportingTsExtensions` (so relative imports include the `.tsx`/`.ts` extension, e.g. `import App from './App.tsx'`). `noEmit` — Vite does the transform.
- **Engine tsconfig** excludes `src/**/*.test.ts` from the build (tests are not emitted to `dist/`); vitest type-checks tests itself.
- **Shared dev deps are hoisted to the root** `package.json` (`typescript`, `@types/node`). Don't re-add them to a workspace unless a version needs to diverge.
- **Lint** is oxlint, not ESLint. Config in `client/.oxlintrc.json` (`react`, `typescript`, `oxc` plugins; `react/rules-of-hooks` errors).
- Assets in `client/public/` are referenced by absolute path (e.g. `/icons.svg#github-icon`); assets imported in `src/` (e.g. `./assets/hero.png`) go through Vite.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MTG-Engine is a Magic: The Gathering rules engine (`engine/`) with a
React web client (`client/`). The repo is an **npm workspaces monorepo** (`workspaces:
["engine", "client"]` in the root `package.json`, in that order so `engine` builds first).

- `engine/` — a TypeScript library package, ESM (`"type": "module"`), NodeNext resolution. Emits to `dist/` with declarations; `package.json` `exports`/`main`/`types` point there.
- `client/` — a working Vite + React 19 + TypeScript app (still the starter template UI in `src/App.tsx`). Declares `engine` as a dependency (`"engine": "*"`, resolved via the workspace symlink) but does not import it yet.

## Engine architecture (`engine/src/`)

The engine is at **milestone 3**: combat. Implemented — turn/step loop with
priority, playing lands, casting creature/instant spells with auto-paid mana,
targeting with resolution-time fizzle, LIFO stack resolution, creature-death
state-based actions, and a full combat phase (declare attackers → declare
blockers → one simultaneous combat-damage step → end of combat). Keywords: haste,
vigilance, defender, flying, reach. **Not yet** — first strike / double strike /
trample / deathtouch, activated & triggered abilities, continuous effects/layers,
planeswalkers, more than two players.

- **`state.ts`** — `GameState` is one plain, `structuredClone`-able tree (no class instances, `Map`/`Set`, or functions inside it). Holds `rules`, players (life, `manaPool`, `landsPlayedThisTurn`), `objects` (card instances; `GameObject.targets` set while on the stack; `attacking`/`blocking`/`blockedBy`/`blocked` set during combat, cleared by `moveObject` on any zone change and by the end-of-combat step), `zones` (`perPlayer` library/hand/graveyard + `shared` battlefield/stack/exile/command as ordered `ObjectId[]`; stack top = last element), `turn`, `priority`, `result`, `eventLog`. Also exports pure selectors.
- **`game.ts`** — `Game` owns the single mutable `GameState` and is the **only** writer. `Game.create(config)` sets up a 2-player game (`config.shuffle: false` for scripted setups). `dispatch(action)` applies an external action (`pass-priority` / `play-land` / `cast-spell`); `advance()` / `advanceUntil(pred)` run the loop (`tick()`): SBAs → if priority held, ask that player's controller for an action → else `endStep()`. When all players pass: resolve the stack top if non-empty (then active player gets priority), else the step ends. `enterStep` runs turn-based actions (untap / draw / **declare-attackers / declare-blockers / combat-damage / end-combat** / cleanup) then SBAs then grants priority. Combat damage is auto-assigned (minimum lethal down the block order). Mana is **auto-paid** (`planManaPayment`). Every mutation goes through `emit()`.
- **`actions.ts`** — the `Action` union (kept out of `game.ts` to avoid a cycle with `controller.ts`).
- **`turn.ts`** — `Phase`/`Step` string-literal unions (no `enum`), `TURN_SEQUENCE`, `nextStep`, `stepUsesPriority` (false only for untap/cleanup), `isMainPhase`.
- **`events.ts`** — discriminated `GameEvent` union (the audit log). `emit()` takes `GameEventInput` (no `seq`).
- **`cards.ts`** — `CardDefinition` is **declarative** (`effect: EffectSpec`, `keywords: Keyword[]`) with an imperative `resolve(ctx)` escape hatch (takes precedence). `CardRegistry` resolves a name → definition; the registry is environment, not serialized state (`GameObject.cardName` is the key). `landProduces(def)` → the color a basic land taps for; `hasKeyword(def, kw)`.
- **`effects.ts`** — `EffectSpec` vocab (only `damage` so far), the `EffectApi` / `ResolutionContext` that both declarative effects and `resolve` scripts call, and `applyEffectSpec`. `Game` supplies the concrete API.
- **`target.ts`** / **`targeting.ts`** — `TargetRef` (player or object) and `TargetSpec` types; `isLegalTarget` / `legalTargets` (need the registry to know what's a creature). Checked on cast and again at resolution (all-illegal ⇒ fizzle).
- **`mana.ts`** — `Color`/`ManaType`/`ManaPool`, `parseManaCost` (`{2}{G}` → `{generic, colored}`; no X/hybrid/`{C}` yet), `manaValue`.
- **`controller.ts`** — `PlayerController`: `act(view)` (priority), `chooseDiscards` (cleanup), `declareAttackers` / `declareBlockers` / `orderBlockers` (combat). `AutomaticController` always passes and never attacks/blocks (so `advance()` with defaults just runs the turn structure). `ScriptedController` plays a queue of `{action, when?}` priority entries plus assignable `declareAttackersFn` / `declareBlockersFn` / `orderBlockersFn` callbacks — this is what the tests use.
- **`primitives.ts`** — branded `PlayerId`/`ObjectId`, seeded `Rng` (mulberry32; `rng.seed` = stream position), `shuffle`.

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
- `npm run play -w engine` — builds, then runs `engine/scripts/play.mjs`: plays a two-player game (default controllers, so it runs to a deck-out) and prints its event log. Flags: `-- --seed 7`, `-- --turns 3` (stop before that turn). The engine has no UI, so this and the tests are how you watch it run.
- `npm run play:cast -w engine` — `engine/scripts/cast-demo.mjs`: land drops, mana, the stack, targeting, creature death.
- `npm run play:combat -w engine` — `engine/scripts/combat-demo.mjs`: a multi-creature attack with a double-block and flying. Shared log formatter in `scripts/format.mjs`.

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

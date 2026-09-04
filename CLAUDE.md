# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MTG-Engine is a Magic: The Gathering rules engine (`engine/`) with a
React web client (`client/`). The repo is an **npm workspaces monorepo** (`workspaces:
["engine", "client"]` in the root `package.json`, in that order so `engine` builds first).

- `engine/` — a TypeScript library package, ESM (`"type": "module"`), NodeNext resolution. Emits to `dist/` with declarations; `package.json` `exports`/`main`/`types` point there.
- `client/` — a Vite + React 19 + TypeScript app: a **two-player hot-seat UI** driving the engine (M6b). Imports `engine` (`"engine": "*"`, the workspace symlink) and consumes only its public seam — `Game`, `viewFor`, `legalActions`, `dispatch`, the `Action`/`LegalAction` types. Needs `engine/dist/` built (`npm run build` does engine first).

## Engine architecture (`engine/src/`)

The engine is at **milestone 9**: the UI seam (M6a) + a React hot-seat client
(M6b) + follow-ups (`order-blockers` as an action, Scryfall card art) +
combat-damage keywords (M7) + **tokens (M8)** + **Auras & Equipment (M9)**.
Implemented — turn/step loop, casting + targeting + fizzle, LIFO stack, SBAs,
full combat **with first strike / double strike / trample / deathtouch /
lifelink / menace**, activated abilities, triggered abilities, the layers 6+7
continuous-effects pipeline, **tokens** (minted by `create-token` effects,
cease to exist once they leave the battlefield), **Auras & Equipment**
(attach on resolution / via an `attach` effect, a static `"attached"` scope,
sorcery-speed-only abilities, and an Aura fall-off SBA), **every decision as a
dispatched action** (`declare-attackers` / `declare-blockers` / `order-blockers`
/ `discard` alongside the priority actions; `chooseTargets` for triggered-ability
targets is the last synchronous controller callback), **`legalActions(player)`**
enumerating what is playable right now with per-slot target options, and
**`viewFor(player)`** producing a redacted, self-contained snapshot for one seat.
**Not yet** — layers 1–5
(copy, control-change, text, **type-change**, colour), layer 7b (set base P/T),
dependency ordering, the first-strike priority window, trample assignment as a
*player* choice (it's auto-assigned), planeswalkers, sagas, sacrifice-as-cost,
>2 players.

- **`state.ts`** — `GameState` is one plain, `structuredClone`-able tree (no class instances, `Map`/`Set`, or functions inside it). Holds `rules`, players, `objects` (card instances; `GameObject.kind` `"card"`|`"ability"`, `abilityKind`, `sourceObjectId`/`abilityIndex`, `counters`, `modifiers`; combat & counter/modifier fields cleared by `moveObject` on any zone change), `zones` (`perPlayer` library/hand/graveyard + `shared` battlefield/stack/exile/command as ordered `ObjectId[]`; stack top = last), `turn`, `priority`, `result`, `awaiting` (a discriminated `AwaitingDecision` — `attackers` / `blockers` / `order-blockers {attacker}` / `discard {count}`), `pendingBlockerOrders` (multi-blocked attackers still needing a damage order), `pendingTriggers` (fired triggers not yet on the stack), `eventLog`. `GameObject` also carries `markedByDeathtouch` (set when dealt damage by a deathtouch source; a lethal-damage SBA reads it; cleared with `damageMarked` on zone change and in cleanup), `summoningSick` (a boolean — set true on entering the battlefield, cleared in the controller's untap step; `hasSummoningSickness` just reads it, so a creature stays sick through the opponent's turn), `isToken` (rule 111 — a token-cleanup SBA deletes it once it's off the battlefield; never reset by `moveObject`, it's intrinsic), and `attachedTo` (the permanent an Aura/Equipment is attached to, or `null`; reset to `null` on any zone change). Also exports pure selectors.
- **`game.ts`** — `Game` owns the single mutable `GameState` and is the **only** writer. `dispatch(action)`: `pass-priority` / `play-land` / `cast-spell` / `activate-ability` / `declare-attackers` / `declare-blockers` / `order-blockers` / `discard`. Multi-blocked attackers are queued in `pendingBlockerOrders` and drained one `order-blockers` action each by `promptNextBlockerOrder`. `advance()` / `advanceUntil(pred)` run `tick()`. `emit()` appends the event **and** runs `detectTriggers` (scans battlefield permanents' `triggered` list against the event, queues matches to `pendingTriggers`). `prepareForPriority(player)` — the pre-priority routine used by `enterStep`, `afterPlayerAction`, and post-resolution: loop { SBAs; `placePendingTriggers` (APNAP: active player's first) } until stable, then grant priority. Mana **auto-paid** via `manaSources`/`tapManaSource`. Ability objects (activated or triggered) are minted onto the stack by `mintAbilityObject` and `delete`d from `state.objects` when they resolve. All P/T reads (combat, SBAs) go through `characteristicsOf`. `combatDamageStep` runs two passes when any combatant has first/double strike (`dealCombatDamage("first")` → SBAs → `"regular"`; folded into one step, no priority window). Blocked-attacker assignment auto-assigns lethal down `blockedBy` (lethal = 1 with deathtouch), then a trampler sends the rest to the defending player. `dealDamage` applies deathtouch marking + lifelink (both general — work for burn, not just combat). `createTokens(controller, tokenName, count)` mints token `GameObject`s straight onto the battlefield (same shape as `playLand`/casting, `isToken: true`); `attachPermanent(source, target)` sets `attachedTo` and is how Equip-like effects attach. `resolveTopOfStack` auto-attaches an Aura (`def.subtypes.includes("Aura")`) to its spell target right after it enters the battlefield. `runStateBasedActions` also sweeps: an Aura whose host is gone goes to the graveyard (reason `"no longer attached to a legal permanent"`); Equipment in the same spot just clears `attachedTo` and stays; a token off the battlefield is deleted from `state.objects` outright (rule 704.5d — it never visibly sits in the graveyard, since both sweeps run in the same SBA pass).
- **`actions.ts`** — the `Action` union (priority actions plus `declare-attackers` / `declare-blockers` / `order-blockers` / `discard`), the `AttackerDeclaration` / `BlockerDeclaration` payloads, and `LegalAction` (what `legalActions` returns; the `declare-blockers` variant carries `menaceAttackers` — block them with 0 or 2+ creatures). Kept out of `game.ts` to avoid a cycle with `controller.ts`.
- **`view.ts`** — `viewFor(state, registry, viewer, opts)` / `game.viewFor(player)` → a `PlayerView`: your hand in full, the opponent's as a count, libraries as counts only, battlefield/stack/graveyards public with **computed** power/toughness/keywords baked in (plus `isToken`/`attachedTo`), so a client needs neither the registry nor the layer system. `{ revealAll: true }` for a hot-seat spectator.
- **`turn.ts`** — `Phase`/`Step` string-literal unions (no `enum`), `TURN_SEQUENCE`, `nextStep`, `stepUsesPriority` (false only for untap/cleanup), `isMainPhase`.
- **`events.ts`** — discriminated `GameEvent` union (the audit log). `emit()` takes `GameEventInput` (no `seq`). `permanent-attached {source, target}` fires whenever an Aura/Equipment attaches (on Aura resolution or via an `attach` effect).
- **`cards.ts`** — `CardDefinition` is **declarative** (`effect`, `keywords`, `activated`, `triggered`, `static: StaticAbility[]`) with an imperative `resolve(ctx)` hatch. `StaticAbility` = `{ affects: AffectSpec, grantPt?, grantKeywords? }`; `AffectSpec` = `"self"` / `"creatures-you-control"` (`+ excludeSelf? / subtype?` for lords) / `"attached"` (the permanent the source is attached to — how Auras/Equipment grant their bonus). Basic lands carry a synthesized `{T}: Add {C}`. The `Keyword` union covers `flying`/`reach`/`haste`/`vigilance`/`defender`/`first-strike`/`double-strike`/`trample`/`deathtouch`/`lifelink`/`menace` (all now wired into combat). An Aura is `types: ["enchantment"], subtypes: ["Aura"]` (`resolveTopOfStack` special-cases the `"Aura"` subtype for auto-attach and `runStateBasedActions` for fall-off); Equipment is `types: ["artifact"], subtypes: ["Equipment"]` plus an `Equip {cost}` activated ability (`effect: {kind:"attach", target:0}`, `targets: ["creature-you-control"]`, `sorcerySpeed: true`) — nothing else marks a card as an Aura/Equipment. A token is just a `CardDefinition` like any other (e.g. `"Soldier Token"`), registered the same way and minted via `createTokens`/`create-token`, not cast. `CardRegistry` resolves name → definition (environment, not serialized). `landProduces(def)`, `hasKeyword(def, kw)`, `defineCard(draft)`.
- **`abilities.ts`** — `ActivatedAbility` (`cost: {mana, tap}`, optional `sorcerySpeed` — Equip-like abilities that function only as a sorcery, rule 602.3), `TriggeredAbility` (`trigger: TriggerSpec`), `isManaAbility`.
- **`effects.ts`** — `EffectSpec` vocab (`damage`, `add-mana`, `draw`, `gain-life`, `tap`, `untap`, `destroy`, `modify-pt`, `add-counter`, `grant-keyword`, `create-token {token, count}`, `attach {target}`; `target` is an index or `"source"`), `EffectApi` / `ResolutionContext`, `applyEffectSpec`.
- **`characteristics.ts`** — `computeCharacteristics(state, registry, id)` / `game.characteristics(id)` → `{ power, toughness, keywords: Set, types, subtypes, controller }`. Folds printed → layer 6 (keyword grants from `static` abilities + modifiers) → layer 7c (counters) → layer 7d (P/T grants + modifiers), timestamp-ordered (`GameObject.timestamp`, from `state.timestampSeq`, set in `moveObject` on entering the battlefield). `staticAffects` resolves the `"attached"` scope as `source.attachedTo === target.id`. **Layers 1–5 and dependency ordering are not implemented.**
- **`target.ts`** / **`targeting.ts`** — `TargetRef` (player or object) and `TargetSpec` (`"any-target"` / `"creature"` / `"creature-you-control"` / `"player"` / `"creature-or-player"` / `"permanent"`); `isLegalTarget` / `legalTargets` take a `forPlayer: PlayerId` (needed for `"creature-you-control"`, e.g. Equip) alongside the registry. Checked on cast and again at resolution (all-illegal ⇒ fizzle).
- **`mana.ts`** — `Color`/`ManaType`/`ManaPool`, `parseManaCost` (`{2}{G}` → `{generic, colored}`; no X/hybrid/`{C}` yet), `manaValue`.
- **`controller.ts`** — `PlayerController.act(view)` is the **single entry point**: when `view.state.awaiting` is set it must return that declaration, otherwise any legal priority action. `ControllerView` carries `state`, `player`, and `legalActions()`. The base classes implement `act` by delegating to `chooseDiscards` / `declareAttackers` / `declareBlockers` / `orderBlockers` (all reached via `answerAwaited` when `state.awaiting` is set); `chooseTargets` (triggered-ability targets) is the only method still called directly by the engine. `AutomaticController` passes and never attacks/blocks; `ScriptedController` plays a `{action, when?}` queue plus assignable `*Fn` callbacks (what the tests use); `RandomController` picks uniformly from `legalActions()`.
- **`primitives.ts`** — branded `PlayerId`/`ObjectId`, seeded `Rng` (mulberry32; `rng.seed` = stream position), `shuffle`.

Snapshot/restore: `game.snapshot()` → `structuredClone(state)`; `Game.fromSnapshot(snap, env)` rebuilds (re-supply `registry`/`controllers` via `env`). Determinism: same seed + same controllers ⇒ identical replay.

## Client architecture (`client/src/`)

A minimal hot-seat client: both seats on one screen, the view swapping to
whoever must act. It **never runs the controller loop** — both players get the
default `AutomaticController` and are never consulted. Instead the human's
choice is `game.dispatch`ed directly, then the engine is settled.

- **`game/useGame.ts`** — owns the one `Game` (in `useState`, lazy-init; `revision` counter forces re-render). `?seed=N` in the URL overrides the starting seed (repro aid); "New game" reseeds randomly. `dispatch(action)` → `game.dispatch` then `settleAndAutoPass`: `advanceUntil` a human decision (game over / `awaiting` / a priority holder), then auto-pass any "dead window" (holder's only legal action is `pass-priority`) so the player isn't clicking Pass through every empty combat step — **except** the active player's own main phases, kept interactive when idle. `seat` = `awaiting.player ?? priority.holder ?? activePlayer`. Exports `view` (`game.viewFor(seat, {revealAll})`), `actions` (`legalActions(seat)`), `nameOf`, `reset`.
- **`game/decks.ts`** — two mana-honest starter decks (the same lists the engine fuzzer uses).
- **`game/board.ts`** — pure layout logic, no React: `computeBoardEntries(view, pid)` turns one player's battlefield into the `BoardEntry[]` the board renders. Three things happen here rather than in JSX: (1) permanents are bucketed by `bucketOf` into `land`/`creature`/`artifact`/`enchantment` using the single most-expansive type (a land-enchantment like Urza's Saga buckets as land, an artifact creature buckets as creature — `BUCKET_ORDER` fixes the row order, lands first); (2) Auras/Equipment are pulled out of their own bucket entirely and nested as `attachments` on whatever `attachedTo` host they're on (looked up across the whole shared battlefield, not just this player's, so enchanting an opponent's creature still nests correctly under that creature); (3) otherwise-identical lands (same `cardName`, same `tapped`, no counters, nothing attached) collapse into one `BoardEntry` with `ids.length > 1`, separately for tapped vs. untapped stacks. A `BoardEntry.ids` is length-1 for everything except a land stack.
- **`format.ts`** — `describeEvent(event, nameOf)` / `describeTarget`, the TS sibling of `scripts/format.mjs`, for the event log.
- **`App.tsx`** — `App` (full-width topbar, `PhaseTrack`, seat banner, error banner, "pass the device" curtain re-armed on seat change) then a `.layout` flex row: `<Table key={game.revision}>` (the player areas, `flex: 4` — opponent stacked above the acting seat) and a sticky `.sidebar` (`flex: 1`, `Stack` in the top quarter, `EventLog` filling the rest, staying in view as the board scrolls). Keying `Table` on revision resets all in-progress selection when the game moves on (no reset effect needed). `Table` classifies `actions` into maps (land/cast by card, abilities by source) and a `mode` (`discard` → `order-blockers` → `attackers` → `blockers` → `targeting` → `priority`); click handlers build the matching `Action`. Each seat's battlefield renders via `renderBoard(pid, isOpp)`, which calls `game/board.ts`'s `computeBoardEntries` and lays out one labelled `.board-row` per non-empty bucket (`BUCKET_LABEL`/`BUCKET_ORDER`), each entry a `.board-entry` with its tile plus a nested `.attachments` strip of compact tiles for anything attached to it. `tileFor` takes the full `ids` array behind a tile (length > 1 only for a land stack) instead of a single id, so highlight/selected/activatable are computed with `.some(...)` over the group; `clickPermanent` similarly takes `ids` and resolves which one the click actually acts on via `pickIdForClick` (prefers an id that's a legal target while `mode === 'targeting'`, else the first). Targeting: click highlighted `targetOptions[slot]` (a `CardTile` or a `PlayerPanel`); multi-slot picks accumulate then dispatch. **`setState` updaters must stay pure** — dispatch happens after `setTargeting`, not inside its updater (React double-invokes updaters in dev). Attackers/blockers/discard/order-blockers: select-then-confirm (order-blockers = click the blockers in damage order, or "keep default").
- **`ui/`** — `CardTile` renders a full card face: title bar (name + mana cost), Scryfall `art_crop` image (colour-tinted fallback on load error), a type line, a text box (keywords in bold + rules text, minus text that only restates the keywords), and a P/T box in the bottom-right corner like a real card. `ui/Symbols.tsx` + `ui/symbols.ts` turn `{…}` tokens (in costs and rules text) into small pips (`{T}` → ↻, colours, generic). Props: `highlight` = must-pick, `selected`, `activatable` = dashed marker, `badge` = ⚔/🛡, `order` = damage-order ordinal, `stackCount` = land-stack size badge (`×N`, only shown when > 1), `compact` = shrink via CSS `zoom` (an attached Aura/Equipment nested under its host). Tiles are 138×190; tapped ones rotate 90° + scale to stay in their slot. Also `PhaseTrack`, `PlayerPanel` (life/mana/zone counts; `targetable` for player targets), `Stack`, `EventLog` (compact `#seq — text` rows, auto-scroll).
- A rejected `dispatch` (e.g. a lone blocker on a menace attacker) surfaces as `useGame().lastError` → a dismissable red banner; the blockers UI also disables its confirm button while a menace attacker has exactly one blocker.
- Styling is one `App.css` — legible dark table, no UI library. Card art is the only network dependency (Scryfall, hotlink-friendly, browser-cached). Out of scope: animation, networking, undo.

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
- `npm run play:combat -w engine` — `engine/scripts/combat-demo.mjs`: a multi-creature attack with a double-block and flying.
- `npm run play:abilities -w engine` — `engine/scripts/abilities-demo.mjs`: a mana dork, an ability on the stack.
- `npm run play:triggers -w engine` — `engine/scripts/triggers-demo.mjs`: ETB, dies, and upkeep triggers.
- `npm run play:static -w engine` — `engine/scripts/static-demo.mjs`: a lord + an anthem buffing a hasty Goblin.
- `npm run play:keywords -w engine` — `engine/scripts/keywords-demo.mjs`: first strike, trample, deathtouch, lifelink, menace in one combat.
- `npm run play:tokens -w engine` — `engine/scripts/tokens-demo.mjs`: Raise the Alarm's declarative `create-token`, and Wurmcoil Engine's dies trigger minting two differently-keyworded tokens.
- `npm run play:attachments -w engine` — `engine/scripts/attachments-demo.mjs`: Holy Strength (Aura) + Bonesplitter (Equipment) both attached to one creature, then it dies — the Aura falls off to the graveyard, the Equipment stays on the battlefield unattached.
- `npm run play:random -w engine` — `engine/scripts/random-demo.mjs`: N random-vs-random games (`-- --games 300`, `-- --log`). Doubles as the engine fuzzer: if `legalActions` ever offers something `dispatch` refuses, this crashes. Deck B carries the newer mechanics (tokens, Auras, Equipment) so the fuzzer exercises them too. Shared log formatter in `scripts/format.mjs`; shared white-box spawn helper in `scripts/spawn.mjs`.

A git-ignored `scratch.mjs` at the repo root is a scratch pad for ad-hoc exploration (`node scratch.mjs` after `npm run build -w engine`).

**Client** (`client/`):
- `npm run dev -w client` — Vite dev server with HMR (build `engine` first, or run `npm run build` from the root once)
- `npm run build -w client` — type-check (`tsc -b`) then `vite build`
- `npm run lint -w client` — oxlint (currently clean, warnings included)
- `npm run preview -w client` — serve the production build
- No client tests yet. To watch it run: `npm run dev -w client` and play a hot-seat game (or toggle "reveal both hands" and drive both seats).

## Toolchain notes

- **Module systems differ**: `engine` is ESM + NodeNext, so its own relative imports need explicit `.js` extensions (e.g. `import { x } from "./foo.js"` even though the file is `foo.ts`). `client` is ESM + bundler mode.
- **Engine TS config is `erasableSyntaxOnly`** (same as the client): **no `enum`, no `namespace`, no constructor parameter properties**. Use string-literal unions + `as const satisfies` tables instead. Also `verbatimModuleSyntax` → split `import type { … }` from value imports. `strict` + `noUnusedLocals`/`noUnusedParameters`.
- **Client TS config** (`client/tsconfig.app.json`) is strict bundler-mode: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`/`noUnusedParameters`, `allowImportingTsExtensions` (so relative imports include the `.tsx`/`.ts` extension, e.g. `import App from './App.tsx'`). `noEmit` — Vite does the transform.
- **Engine tsconfig** excludes `src/**/*.test.ts` from the build (tests are not emitted to `dist/`); vitest type-checks tests itself.
- **Shared dev deps are hoisted to the root** `package.json` (`typescript`, `@types/node`). Don't re-add them to a workspace unless a version needs to diverge.
- **Lint** is oxlint, not ESLint. Config in `client/.oxlintrc.json` (`react`, `typescript`, `oxc` plugins; `react/rules-of-hooks` errors).
- Assets in `client/public/` are referenced by absolute path (e.g. `/favicon.svg`); assets imported from `src/` go through Vite (the app currently imports none — `src/assets/` was removed with the starter template).
- **The client drives the engine synchronously.** `game.dispatch()` fully settles (resolves the stack, runs no-priority turn-based actions) before returning; there is no async and no controller callback in the human path. Every player decision — including `order-blockers` — is a dispatched action the client renders. The last synchronous controller callback, `chooseTargets` (for a triggered ability's targets), falls through to `AutomaticController` (first legal target); the client never hits it because its controllers are never consulted.

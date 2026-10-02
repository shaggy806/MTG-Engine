# engine/ — the rules engine

A TypeScript library, ESM + NodeNext (relative imports need `.js`). No I/O, no UI: a pure state
machine driven entirely through `Game.dispatch`. Read `ROADMAP.md`'s *Architecture constraints*
before changing it, and `src/cards/AUTHORING.md` before authoring a card.

**Full per-file detail: `docs/architecture/engine.md`.** It has an entry for every module below
(what it owns, its vocabulary, and why it's shaped that way) plus every engine command in full.
Read a file's entry before changing that file; you don't need the rest.

## Rules that aren't obvious from any one file

- **`Game` (`game.ts`) is the only writer of `GameState`.** Everything else is pure over state:
  selectors, `mana-payment.ts` (returns a plan and never applies it), `combat/`, `decisions/`.
  `GameState` is one plain, clonable tree: no class instances, `Map`/`Set` or functions in it.
- **Every player decision is a dispatched action**, never a synchronous callback. Each of the
  22 kinds is a module under `decisions/`, registered in total `as const satisfies` tables, so a
  new kind fails the build until it's wired everywhere (`docs/plans/decision-registry.md`).
  **Nothing under `decisions/` imports `game.js`, and `state.ts` imports nothing from
  `decisions/`** (real ESM cycles). `defineDecision` is in its own file for the same reason.
- **Rules accuracy is mandatory.** Match the Comprehensive Rules and cite the rule number;
  known gaps are listed in `BACKLOG.md` under "Engine rules gaps".
- **Acting on an object needs it to still be the same object** (rule 400.7): check
  `zoneChangeCount`/stints. A permanent that left is read through its `lastKnown` snapshot
  (603.10a, 608.2h). Simultaneous leaves, graveyard leaves and entries are each one event
  (`withLeaveBatch`, `withGraveyardLeaveBatch`, `withEnterBatch`).
- **`moveObject` is the single zone-transition function** and returns whether the move
  happened. It can defer a commander's move (903.9b) or refuse a card that can't enter.
- **Token stacks.** One `GameObject` with `stackCount` can stand for many identical tokens.
  **Anything that counts permanents counts a stack as every token in it** (`permanentCount`,
  `weightedMatches`). Anything that singles one token out splits it off first (`splitOneFromStack`,
  targets at `lockInTargets`). Combat wakes a stack into one object per token
  (`materializeStack`), or only a declaration's `count` of them (`combat/stack-counts.ts`).
  Loops that mint one real thing per unit stop at `Game.MAX_EFFECT_INSTANCES`.
- **Computed-value cache** (`characteristics.ts`): wrap new read-only hot paths in
  `withComputedCache`, and never let a region span a mutation without `invalidateComputedCache()`.
  `MTG_CACHE_CHECK=1` on the fuzzer verifies it.
- **Every P/T, type or keyword read goes through `computeCharacteristics`** (the layer fold) or
  its cheaper layer-4 reads (`effectiveTypes`/`effectiveSubtypes`). Subtype questions use
  `subtypes.ts`'s `hasSubtype`, never `includes` (changeling).
- **`"sideEffects": false`** holds only because no engine module does anything at import time
  but define things. Keep it so, or every page ships the whole card pool.
- **The client imports `engine/client`** (`src/client.ts`), never the barrel. It must not start
  exporting `BUILTIN_CARDS`, `POOL_CARDS`, `TOKEN_CARDS` or `createDefaultRegistry`.
- **Determinism:** same seed + same controllers ⇒ identical replay. The fuzzer's `RandomSource`
  draw order and bots' default-off `timeBudgetMs` exist to protect it.
- **`game.ts` contains a literal NUL byte**, so git and grep treat it as binary: use `grep -a`,
  and don't remove the byte (see the root `CLAUDE.md`).

## Where things are

- Core loop: `game.ts` (dispatch, priority, SBAs, combat, `moveObject`), `state.ts` (the state
  tree and selectors), `actions.ts` (`Action`/`LegalAction`), `view.ts` (`viewFor`, the redacted
  per-seat snapshot), `turn.ts`, `events.ts`, `auto-settle.ts`, `primitives.ts`.
- Rules machinery: `characteristics.ts` (layers 1–7, the cache), `replacements.ts`,
  `abilities.ts` (activated/triggered/static specs), `effects.ts` (the `EffectSpec`
  vocabulary), `filter.ts` (`CardFilter`), `target.ts`/`targeting.ts`, `mana.ts`,
  `mana-payment.ts`, `combat/`, `decisions/`, `goad.ts`, `subtypes.ts`, `this-way.ts`.
- Cards: `cards/` (`define.ts`, `helpers.ts`, `registry.ts`, one file per card in `cards/pool/`
  and `cards/tokens/`). **To add a card, drop a file in `cards/pool/` and run `npm run gen:cards
  -w engine`**, which regenerates `cards/generated.ts` and the client shards.
- Commander and decks: `identity.ts`, `deck-validation.ts`, `sample-decks.ts`, `card-replacer.ts`.
- Bots: `controller.ts` (v1 `HeuristicBotController`, `RandomController`), `bot/` (v2,
  `EvalBotController`, what live rooms seat), `target-polarity.ts`, `effect-worth.ts`. Read
  `docs/plans/bot-effect-knowledge.md` before changing how a bot picks actions.

## Tests

In `src/test/*.test.ts`, one level below the source (so relative imports need an extra `../`),
except `cards/pool.test.ts`. Each major mechanic has its own test file; read it for a runnable
example. `vitest.config.ts` turns off `isolate` (one card-barrel import per worker), which is
safe only while **no engine test mocks, spies, stubs a global or fakes timers**. **While
authoring, run just the files you touched** (`npx vitest run cmdr-sokka pool.test` from
`engine/`, ~15s), and the whole suite once per batch before committing.

## Commands you'll use most

(All from the repo root with `-w engine`. Full descriptions are in `docs/architecture/engine.md`.)

- `card:lookup -- "Name"`: the Oracle text, rulings and tokens, read from the offline snapshot.
  Run before authoring.
- `card:scaffold -- "Name"`: writes a draft card file into `cards/scaffold/`.
- `gen:cards`: regenerates the card barrel after adding a card.
- `card:verify` / `card:text`: checks the pool against Scryfall (structure / rules text).
- `test`, `typecheck`, `build`. The fuzzer and scripts run `dist/`, so **build first**.
- `play:random -- --games N [--players 4] [--seed S] [--with "Card"]`: the fuzzer.
- `bot:bench`, `bot:scenarios`, `bot:behaviour`, `bot:ab`, `bot:diff`, `bot:replay`: bot
  measurement (the `ab-bench`, `decision-diff` and `replay-seed` skills drive them).
- `bot:captures`: the positions captured from live games (`captures/`), open and resolved, with
  v2's answer today; `-- resolve <name> --note "…"` moves a fixed one to `captures/resolved/`,
  where it gates.

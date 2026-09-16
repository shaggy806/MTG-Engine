# Smarter bots (v2 — one-ply search over a tuned evaluation)

Status: **in progress** — this is the design record for replacing
`HeuristicBotController`'s greedy "highest mana value wins" policy with a one-ply search:
enumerate the concrete actions available right now, simulate each against a throwaway copy
of the game, score the resulting state with a weighted linear evaluation, and take the best.
The v1 bot (`docs/plans/basic-bots.md`) stays as the fallback and as the benchmark opponent
the tuner measures against.

The motivating requirement is **training-quality self-play**, not just a better live
opponent: the tuner needs thousands of games whose results mean something, which is also
why the bots' decks had to become format-legal first (see "Decks" below).

## Why one-ply-plus-evaluation, and not something cleverer

The engine hands this to us almost free. `GameState` is one plain `structuredClone`-able
tree, `Game.fromSnapshot` rebuilds a working `Game` from it, and `dispatch` is the only
writer — so "what would the board look like if I did this?" is a clone, a dispatch, and a
settle, with no risk to the real game and no per-card special-casing. Measured on a
13600K, mid-game, two players:

| | |
|---|---|
| `structuredClone` of the full state | 0.46ms |
| ... with `eventLog` dropped first | **0.27ms** |
| `fromSnapshot` + `dispatch` + `advanceUntil` | ~0.3ms |
| concrete actions per priority window | median **2**, p99 ≈ 9, max 211 (4 players) |
| whole decision, greedy horizon | **0.55ms** |
| whole decision, common horizon to end of turn | **1.7ms** |

`server/src/room.ts` already holds every bot action behind `BOT_MIN_THINK_MS` (350ms) so
the clients can play their animations. A 1.7ms search disappears inside a pause the server
is already taking on purpose — roughly 200x headroom. Runtime cost is a non-issue; the
only real budget is the tuner's, and that one is allowed to be expensive.

Monte-Carlo rollouts and ISMCTS are the strictly stronger family and are deliberately
deferred — see "Deferred" at the bottom. One-ply has by far the best strength-per-unit-of-
work here, and both of the stronger options need a good evaluation function anyway, so this
work is a prerequisite either way.

## Three findings that decide the design

These came out of a throwaway prototype run against `HeuristicBotController` before any of
this was written, and each one is a trap that looks fine on paper.

### 1. The naive feature set makes the bot catatonic

The obvious features — life, cards in hand, creature count, total power — score a land drop
as *strictly negative*: one fewer card in hand, and nothing else in the vector moves. Same
for ramp, card draw, removal, and equipment. A bot that only acts on a positive delta
therefore never plays a land, never casts a spell, and passes every window.

Measured, exactly as described: **0 wins, 20 losses**, 215 consecutive passes, dead on an
empty board at turn 20 holding seven cards.

The evaluation has to cover every resource an action converts *into*, not just the
visible board. The minimum viable vector is life, hand, creatures, power, toughness,
**lands/mana sources**, **total permanents**, **library size** (deck-out), commander damage
taken, and a terminal win/loss term. And it must be *relative* — your score minus the best
opponent's, since a wrath that costs you two creatures and an opponent six is a gain.

### 2. Weights are load-bearing, not decoration

Adding a `lands` term fixes finding 1 only if the weight is large enough to outweigh the
card it cost. The sensitivity is a cliff, not a slope:

| `lands` weight | result vs `HeuristicBotController` |
|---|---|
| 1.5 | 2W–28L |
| 3.0 | 16W–14L |
| 5.0 | 16W–14L |
| 8.0 | 14W–16L |

One weight crossing one threshold is the whole difference between unplayable and
competitive. This is the empirical case for the tuner: hand-picked weights are not
defensible.

### 3. The stack means "the state after my action" is not what you think

Dispatching `cast-spell` leaves a state where the spell is *on the stack* and nothing has
happened yet. Score that and every spell reads as "one fewer card in hand" — finding 1
again, wearing a different hat. The simulation must roll forward until the stack drains
before the evaluation runs.

Related, and the reason for the `horizon` parameter below: scoring against "is this better
than the current state" makes the bot inactive-by-default and turns the zero point into an
extra implicit weight. Rolling *every* candidate — `pass-priority` included — out to a
common horizon and comparing them against each other removes that failure mode. It costs
2–3x more per decision and showed no measurable strength change over 30 games, but 30 games
is far below the noise floor (see "Tuning"), and the fragility it deletes is real.

## Architecture

### `engine/src/bot/` (new)

- **`evaluate.ts`** — `EvalWeights` and `evaluateState(state, registry, me, weights)`, pure
  and synchronous over a `GameState`. Two things that bit the prototype and are worth
  stating: `Characteristics.types` is a lowercase string **array** (`"creature"`,
  `"land"`), not a `Set` and not capitalized; and `GameObject.stackCount` means one object
  can stand for twenty creatures (see `CLAUDE.md`'s "Token stacking"), so every per-object
  contribution multiplies by it.
- **`candidates.ts`** — `LegalAction` → the concrete `Action`s it stands for, with a cap on
  the per-slot target cross-product. Largely a generalization of what
  `HeuristicBotController.toCastSpell` / `castExtras` already do, except enumerating where
  those pick the first or last option.
- **`simulate.ts`** — clone (dropping `eventLog` first: half the bytes, and the bot never
  reads it), `Game.fromSnapshot`, `dispatch`, `advanceUntil(horizon)`. Two non-obvious
  requirements. Every seat in the simulation **must** get an `AutomaticController`:
  `Game.tick()` invokes `controllers[holder].act()`, so a simulation that inherited the
  searching bot would recurse forever. And the dispatch must be wrapped — `legalActions`
  enumerates variants whose specific concrete filling can still be refused.

### `EvalBotController`

Extends `HeuristicBotController` and overrides `act` only. Every `awaiting` decision keeps
the inherited answer to begin with, so this is a strict, reviewable delta over a bot that
already plays whole games; `declareAttackers` / `declareBlockers` get the same treatment in
a second pass (see "Where one-ply is blind").

Weights live in a checked-in constant, so a tuning run lands as a one-line diff.

### Server

One line: `Room.addBot` constructs an `EvalBotController`. The frame/pacing/ack machinery
is untouched, because the search fits inside `BOT_MIN_THINK_MS`.

## Where one-ply is blind

Worth writing down so nobody expects these to improve on their own:

- **Attacking.** Attacks are declared *before* blocks, so a one-ply evaluation of
  "declare attackers" sees only that its creatures are now tapped and scores it negative.
  This needs its own treatment — simulate through the block step, assuming the opponent
  blocks with our own block heuristic. This is the single largest strength gain available
  after the evaluation itself, and it is far cheaper than general lookahead.
- **Holding up instants.** The bot re-decides at every priority window with no plan, so it
  will always cast on its own turn rather than hold a counterspell.
- **Sequencing.** No concept of "cast the cost-reducer first."

## The action space, and what must never be enumerated

Measured over bot-vs-bot games, per decision:

- **Priority windows**: median 2 concrete actions, p99 ≈ 9, max 211 (4 players). Exhaustive
  enumeration is fine, with a per-decision simulation cap (~200) as the backstop — that
  bounds the worst case at roughly 60ms, still inside the think timer.
- **Attacker declarations**: `(defenders + 1) ^ eligible creatures`. Only 16 came up in
  these games, but a ten-creature board against three opponents is ~1M. This stays
  constructive/greedy-incremental and is **never** enumerated. Blocks likewise.

## Tuning

Mandatory, per finding 2, and cheap: games run in 130–650ms single-threaded and the target
machine has 20 cores, so ~1000 games is 20–60s of wall clock and a 100-configuration sweep
is about an hour.

The thing to respect is the **noise floor**. 30 games is ±5 wins of pure variance, which
makes the 16W–14L rows above statistically indistinguishable from a coin flip. Budget
400–1000 games per configuration to resolve a 55% win rate from 50%.

`engine/scripts/tune-bot.mjs` (not shipped): a `worker_threads` pool, one game per task,
seats alternated so the play/draw advantage cancels, several deck pairings, and a JSON log
so runs resume. A `bench` mode reports candidate vs current `HeuristicBotController` with a
confidence interval, so a run can't be read as signal when it's noise.

Two ways to overfit, both real here:

- **To the decks.** Tuning against a handful of decks tunes to those decks. Re-validate the
  winner on held-out seeds *and* held-out deck pairings.
- **To the opponent.** The benchmark is a fixed, weak bot, so a sweep optimizes for beating
  *it*. Periodically re-anchor against the current best candidate, not just v1.

Don't grid-search the weight vector — it has ~10 dimensions. Use CMA-ES or a (1+1)
evolution strategy against the fixed benchmark first, then consider population self-play
with Elo once a single strong configuration exists.

## Decks

The tuner is only as meaningful as the games it measures, and `SAMPLE_DECKS` was explicitly
not format-legal: 60 cards instead of 100, colour identity ignored, and curated to exercise
engine features rather than to play a game of Magic. Tuning against those would optimize
for a format that doesn't exist. Replacing them with legal, coherent Commander decks is
therefore a **prerequisite** for the tuning work, not a follow-up — tracked separately.

## Tests

`engine/src/test/eval-bot.test.ts`, mirroring `heuristic-bot.test.ts`: bot-vs-bot and
bot-vs-v1 run to completion at 2/3/4 players, which makes this a third fuzz target
alongside `random-demo.mjs` and the v1 bot's own test. Plus direct unit tests on the
evaluation, written as the regressions they guard: a land drop must not score negative, and
removal aimed at the biggest creature must beat the same spell aimed at the smallest.

## Deferred

- **Truncated Monte-Carlo rollouts** — score by win rate over N playouts instead of by
  weights, which nearly eliminates the tuning problem. Full playouts are too slow (a whole
  game is ~30ms, so ten rollouts across five candidates is 1.5s), but three-turn truncated
  rollouts fit inside the 350ms budget. Worth revisiting *after* a good evaluation exists,
  since a truncated rollout needs one to score its leaf.
- **ISMCTS** — the research-correct answer for hidden-information card games. Needs
  determinization, which the current design sidesteps by cheating (below). Not until the
  above is exhausted.
- **Difficulty levels.** Once weights are a data table, an "easy" bot is a worse weight
  vector or a smaller simulation cap, not a second code path.

## Known: the bot cheats

`ControllerView.state` is the real, un-redacted `GameState` — opponents' hands and library
order included — and always has been (`docs/plans/basic-bots.md` relied on it for
`computeCharacteristics`). v1 barely used it, so it was invisible. A *simulating* bot
exploits it hard: it will score a spell against the exact card an opponent is holding, and
its simulated draws come off the real library because `fromSnapshot` restores `rngState`.

This is a deliberate, recorded decision rather than an oversight. The honest version builds
its simulation from `viewFor(seat)` plus a randomized plausible completion of the hidden
zones, which is a substantial piece of extra work and also makes every evaluation noisier.
Revisit if bot play ever feels uncannily well-informed.

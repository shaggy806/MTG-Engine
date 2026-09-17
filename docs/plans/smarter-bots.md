# Smarter bots (v2 — one-ply search over a tuned evaluation)

Status: **in progress** — the search bot, evaluation, benchmark and tuner exist
(`engine/src/bot/`, `engine/scripts/tune-bot.mjs`) but live rooms still seat the v1 bot. Phase 0
(a benchmark that measures the game rooms actually play) is done; see "Work plan" for the rest.

This is the design record for replacing
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
is already taking on purpose — roughly 200x headroom. (These numbers are from the original
60-card decks. On real Commander boards they no longer hold — see "Measuring the game rooms
actually play".)

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

`engine/scripts/tune-bot.mjs` (`bot:bench` / `bot:tune`): a `worker_threads` pool, one game
per task, seats rotated within blocks so play/draw order and deck strength cancel (see
"Measuring the game rooms actually play"), and a `--json` log of every iteration. A `bench`
mode reports candidate vs `HeuristicBotController` with a confidence interval, so a run can't
be read as signal when it's noise. Resuming an interrupted tune isn't implemented.

Two ways to overfit, both real here:

- **To the decks.** Tuning against a handful of decks tunes to those decks. Re-validate the
  winner on held-out seeds *and* held-out deck pairings.
- **To the opponent.** The benchmark is a fixed, weak bot, so a sweep optimizes for beating
  *it*. Periodically re-anchor against the current best candidate, not just v1.

Don't grid-search the weight vector — it has ~10 dimensions. Use CMA-ES or a (1+1)
evolution strategy against the fixed benchmark first, then consider population self-play
with Elo once a single strong configuration exists.

## Decks

The tuner is only as meaningful as the games it measures, and `SAMPLE_DECKS` was originally
not format-legal: 60 cards instead of 100, colour identity ignored, and curated to exercise
engine features rather than to play a game of Magic. That prerequisite is met — `SAMPLE_DECKS`
is now the five 2022 Starter Commander Decks (`docs/plans/precon-decks.md`).

## Measuring the game rooms actually play (Phase 0 — done)

The first benchmark measured a game nobody plays, which a tuner would have happily optimized
for. What changed, and why each one mattered:

- **Rules.** Benchmark games ran at 20 life with no mulligan phase; rooms play 40 life, the
  free first mulligan and a real mulligan decision. `COMMANDER_RULES` (engine `state.ts`) is
  now the one definition, read by both `ws-server.ts` and the worker. Life total alone moves
  the `life` weight's whole scale.
- **Deck pairings.** Seat *i* always got deck *i*, so every two-player game ever measured was
  the same two decks. Seeds now come in blocks of `players` games; a block fixes one seating
  from a shuffle of every ordering of distinct decks, and the candidate takes each seat once
  within it, so deck strength and play/draw order both cancel. `--games` rounds up to a
  multiple of `--players` to keep blocks whole, and the report breaks results down by the
  candidate's deck.
- **What "even" means.** The tuner accepted a mutation when its interval cleared 50%, which at
  four players (one candidate against three incumbents, even = 25%) would reject everything.
  The bar is now `1/players`, draws count as a `1/players` share rather than being dropped,
  and the interval is Wilson rather than Wald (Wald misbehaves near 25%).
- **Failures.** Errors were counted and discarded. Each is now reported with its seed so it
  can be replayed, and a game that overruns `--timeout` (default 300s) has its worker killed
  and replaced — a runaway loop inside one tick can't be stopped from inside the worker, and
  would otherwise stall the run silently.
- **Think time.** The report carries the candidate's mean and worst decision time and the
  seed of the worst, because the room's think pause is a budget the worst case has to fit.

**Baseline under these conditions** (default weights, `--horizon turn`, 18 workers on a
20-core machine, 2026-09-16):

| | v2 vs v1 | even | game | decision avg / worst |
|---|---|---|---|---|
| 2 players, 400 games | **66.3%** [61.5, 70.7] | 50% | 19.5 turns, 9.5s | 37ms / 1.95s |
| 4 players, 200 games | **36.7%** [30.3, 43.6] | 25% | 43.9 turns, 66s | 125ms / 14.0s |

The same bot measured 52.3% +/-4.9% at two players on the old 60-card, 20-life setup, so the
move to real Commander games alone changed the answer. Per deck the candidate ranged from
55% (Chaos Incarnate) to 76% (Grave Danger) at two players. One four-player game (seed 104)
hit the 300s timeout; replayed alone it isn't a hang but a 56-turn game that took 9 minutes,
with an 80-permanent board where mana taps were ~45 of every ~48 search candidates.

**The search is no longer cheap.** The "Why one-ply" timings above were taken on 60-card
decks; on 100-card Commander boards the worst decision is 2s at two players and 14s at four,
against a 350ms think pause, and a 200-game four-player bench takes 13 minutes. Tuning at
four players isn't practical until that comes down (Phase 1's mana-ability fix is the first
step), and Phase 6 now has a real time budget to meet rather than a formality.

## Work plan

Agreed 2026-09-16. Each phase is measured with `bot:bench` before and after.

1. **Evaluation features.** First, stop searching mana abilities: `candidates.ts` expands
   every land's `{T}: Add` into a candidate and rolls each to end of turn, which v1 already
   learned gains nothing (casting auto-pays). On a 38-permanent board 27 of 30 candidates were
   mana taps, and one upkeep decision took ~2s against a 350ms think pause (2-player seed
   102). Then add every term the current vector is blind to: commander damage
   taken, planeswalker loyalty, counters beyond P/T (poison isn't modeled by the engine), keywords/evasion,
   what the hand actually holds rather than just its size, mana value on the battlefield,
   untapped mana and tapped/summoning-sick creatures, graveyard value (flashback, escape…),
   energy, the monarch, emblems, commander tax, the threat from *every* opponent rather than
   only the strongest, a draw scored as a draw (today it scores as a loss), and diminishing
   returns on lands. Also untangle the double counting (a land is `lands` + `permanents`).
   Every term stays a flat weight so the tuner can move it, with a unit test per term.
2. **Combat.** Attackers built greedy-incrementally — add the attacker/defender pair that most
   improves the evaluation, simulated through blocks (opponent blocking with the v1 rule) and
   damage — and blocks the same way. Never enumerated. Two checks frame every attack
   declaration (see "Combat: the alpha strike and crackback" below).
3. **Rollout policy.** The simulation's stand-in controllers never attack or block, so no
   priority decision ever sees combat damage. Give them the v1 combat decisions.
4. **Other decisions.** Trigger targets, sacrifices, modes and scry through the same
   simulation, instead of the inherited v1 answers.
5. **Tune.** (1+1)-ES at two players, validated at four, on held-out seeds and seatings —
   scored against a gauntlet of opponents, never v1 alone (see "Not just beating v1").
6. **Ship.** `Room.addBot` seats `EvalBotController` once it passes the gauntlet at both two
   and four players, passes every scenario test, and its worst-case decision time fits the
   think pause. From then on rooms record bot game results (see below).

### Not just beating v1

A tuner optimizes exactly what it's scored on. Scored only against v1 it will find whatever
v1 is bad at — v1 attacks with everything and never holds back blockers, so a vector that
punishes that would look superb and could be worse against anything else, including itself
and people. Four guards, cheapest first:

1. **A gauntlet, not a benchmark.** Fitness is the result against a pool of frozen opponents:
   v1, every weight vector that has ever been accepted or shipped (each checked in under
   `engine/src/bot/champions/` with its date and bench numbers), and a few deliberately
   different *styles* — hand-set aggressive, defensive and ramp-heavy vectors — so no single
   opponent's weaknesses dominate. A candidate is accepted only if it beats the incumbent head
   to head **and** doesn't regress against any gauntlet member (no member where its interval
   sits wholly below its previous result). Head-to-head against the incumbent stays the
   primary signal; the gauntlet is the veto.
2. **Mixed tables.** At four players the candidate sits with a mix — incumbent, v1, an older
   champion — rather than three copies of one opponent, which is closer to a real pod and
   stops it learning to farm one policy.
3. **Scenario tests that don't depend on any opponent.** Hand-built positions with a known
   right answer: take lethal when it's on board, don't swing into lethal crackback, don't chump
   when not facing lethal, remove the biggest threat rather than the smallest, don't tap mana
   for nothing. These encode correct play directly, so a vector that's "winning" by
   exploiting a benchmark but fails them is rejected. They grow every time a live game
   shows a bad play.
4. **Real players are the ground truth.** Once shipped, rooms append one line per finished
   game with a bot in it — bot version and weights id, seat count, which seats were human,
   winner, turns — to a server-side log. That's the only measure of "good against people",
   and it's what decides whether a tuning run that won in self-play actually shipped an
   improvement. An Elo ladder across champions (and eventually humans) is built from the
   same records.

One more reason the cheat matters here: a bot that reads hands and library order will look
stronger against bots than it plays against people, because it never has to guess. Anything
tuned while cheating should be re-benched once the honest version exists.

### Combat: the alpha strike and crackback

Two questions a one-ply evaluation can't answer on its own, because both are about a turn
that hasn't happened yet: *can I win right now by swinging with everything*, and *if I swing,
do I die on the way back*. Both are answered by a small, pure combat calculator
(`bot/combat-math.ts`) over computed characteristics — not by engine rollouts, which would
cost a full opponent turn per candidate attack set, and whose stand-in controllers don't
attack anyway (Phase 3).

**The calculator.** `damageThrough(attackers, blockers, defenderLife)` is the least damage an
attack is guaranteed to deal when the defender blocks as well as they can: each blocker is
assigned to the attacker it stops the most damage from, where a blocker stops an attacker's
whole power, or only its toughness's worth against trample. Legality comes from the same
places `legalActions` gets it — flying/reach, menace (two blockers or none), "can't block",
must-be-blocked — and first strike/deathtouch only matter for who survives, not how much gets
through. Greedy over attackers by power is close to exact at the board sizes that come up; a
small assignment solve is the fallback if measurements say otherwise. Commander damage is
tracked per commander alongside life (21, rule 903.10a), since a commander connecting can be
lethal while the life total isn't.

**1. The alpha check, always first.** Before building an attack incrementally, score the
full swing — every eligible creature, each at the defender it can threaten most — against
that defender's best blocks. If the guaranteed damage is lethal (life, or 21 commander damage
from one commander), declare it and skip everything else: a won game outranks every positional
term. In multiplayer this is per defender, and "lethal" means eliminating that player.

**2. Crackback, as a constraint on everything else.** For a candidate attack set, work out
our defence on the turns before we untap: the creatures that *didn't* attack, plus attackers
with vigilance, minus whatever the combat itself is expected to kill. Then run the calculator
the other way — each opponent swinging every creature they'll have untapped (all of them, less
their own losses from our attack) at us, into those blockers. If the damage that gets through
is lethal, the attack set is rejected, however good it scores. Attackers are pulled back
cheapest-to-keep-home first (the ones whose blocks stop the most damage) until the crackback is
survivable, and whatever's left is what the incremental builder works from.

Two escape hatches keep this from making the bot passive:

- **Already dead.** If the crackback is lethal even with no attack at all, holding back buys
  nothing — the constraint is dropped and the bot races.
- **Winning the race.** If the alpha check says we win now, crackback never runs.

**Multiplayer.** Assuming every opponent attacks us is paranoid at a four-player table — they
have each other to attack. The crackback sum is over opponents, each weighted by a tunable
`crackbackParanoia` (1 = everyone swings at us; 0 = ignore anyone but the next player), and it
counts only opponents whose turn comes before ours. That weight goes to the tuner with the
rest.

**Deliberately not modeled (yet):** instant-speed tricks, haste creatures still in hand, and
removal on our blockers. The bot can see the hands (see "Known: the bot cheats"), but leaning
on that makes combat worse the day the cheat is removed; a flat `crackbackMargin` of life to
keep in reserve is the honest stand-in, and is tuned too.

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

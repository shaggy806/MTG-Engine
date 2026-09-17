# Smarter bots (v2 — one-ply search over a tuned evaluation)

Status: **in progress** — the search bot, evaluation, benchmark and tuner exist
(`engine/src/bot/`, `engine/scripts/tune-bot.mjs`) but live rooms still seat the v1 bot. Phase 0
(a benchmark that measures the game rooms actually play), Phase 1 (the evaluation's feature
set), Phase 2 (combat), Phase 3 (rollout policy) and Phase 4 (decisions mid-resolution) are
done. Phase 5 (tuning) is in progress and has **changed method** — the weights are fitted by
logistic regression over harvested self-play positions rather than searched by evolution
strategy; see "Fitting the weights from self-play" below. See "Work plan" for the rest.

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

- **`features.ts`** — `FEATURE_KEYS` and `playerFeatures(state, registry, player, isMe,
  landCap)`: one player's raw, *unweighted* feature vector. Two things that bit the prototype
  and are worth stating: `Characteristics.types` is a lowercase string **array**
  (`"creature"`, `"land"`), not a `Set` and not capitalized; and `GameObject.stackCount` means
  one object can stand for twenty creatures (see `CLAUDE.md`'s "Token stacking"), so every
  per-object contribution multiplies by it. Split out of `evaluate.ts` so the weights can be
  fitted — see "Fitting the weights from self-play".
- **`evaluate.ts`** — `EvalWeights` and `evaluateState(state, registry, me, weights)`, pure
  and synchronous over a `GameState`; a dot product over `features.ts`, aggregated across the
  table as yours minus your opponents'.
- **`scenarios.ts`** — opponent-independent positions with a known right answer, parameterised
  by a weight vector. See "Not just beating v1", guard 3.
- **`champions/`** — frozen weight vectors, each spelled out in full. See guard 1.
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

## Fitting the weights from self-play (Phase 5)

The (1+1)-ES above is the method this plan was written with, and measuring it against what it
costs is what changed the plan. **Each iteration buys one accept/reject bit for 200 games** —
two minutes at two players, thirteen at four. Thirty iterations is thirty bits with which to fit
a two-dozen-dimensional vector, which is why the hand-picked defaults were never convincingly
improved on. A better optimizer over the same signal (CMA-ES) is worth maybe 2-3x, not the
order of magnitude the problem needs.

**The same games already contain far more information than that.** Every position a game passes
through is a labelled example the moment the game ends — this seat went on to win, or it didn't.
One 20-turn game yields ~20 of them instead of a fraction of a bit, and a few thousand games is
~150k labelled positions. A logistic regression over those reads the weights straight off, as
log-odds contributions to winning. The games are the only real cost, and they're games the ES
would have played anyway.

- **`engine/src/bot/features.ts`** — the split that makes any of this possible. `evaluate.ts`
  used to compute a feature and multiply it by its weight in one expression, which is fine for
  scoring and useless for fitting. `playerFeatures(...)` now returns the raw, unweighted vector
  and `evaluateState` is a dot product over it. The refactor is exact: identical games on
  identical seeds before and after.
- **`scripts/harvest-positions.mjs`** (`bot:harvest`) — self-play games, sampling a position at
  every **turn boundary**, which is deliberately the same place the search scores a candidate
  under `--horizon turn`. Fitting on the distribution the evaluator is actually asked about is
  most of the point. Each position emits *both* seats' vectors, labelled 1 and 0, which makes
  the fit symmetric: any bias from the starting player always sitting in seat 0 cancels between
  the pair. The pair is not simply `x` and `-x` — `handManaValue` is gated on `isMe`, so each
  seat's vector is computed properly rather than negated.
- **`scripts/fit-weights.mjs`** (`bot:fit`) — no-intercept L2 logistic regression,
  `P(win) = sigmoid(w·x)` over the same sign-folded difference vector `evaluateState` takes, so
  a fitted coefficient drops into `EvalWeights` untranslated. Columns are scaled (not centred —
  centring without an intercept changes the model, and the pairing already puts every mean near
  zero) so one L2 penalty means the same thing across features that differ by two orders of
  magnitude. **Each game carries equal weight regardless of length**: a 60-turn grind is not
  three times as informative as a 20-turn game, its positions are near-duplicates of each other.
  Holdout is split by *game*, never by row, for the same reason. The output is normalised to
  `life = 1`, which keeps it readable beside the hand-picked vectors and keeps `evaluate.ts`'s
  absolute sentinels (a won game at 1e6, a dead player at -1e4) as dominant as designed.

**What is not fitted.** Five weights aren't coefficients and a linear fit can say nothing about
them: `landCap` is a threshold *inside* a feature, `opponent`/`otherOpponents` are how a bigger
table is aggregated above this layer, and `crackbackParanoia`/`crackbackMargin` are knobs on the
attack builder's combat arithmetic. They stay hand-set, or the ES's job. The fit is also run at
**two players only**, where "the opponent" is unambiguous.

### Correlation is not action value — the finding that shaped the fit

The first unconstrained run, on 1600 games, reached **70% holdout accuracy** at predicting the
winner from a mid-game position, and produced a vector that plays badly. Among its coefficients:

| term | fitted | what it's really saying |
|---|---|---|
| `extraLands` | **-4.64** | twelve lands out means a long game, and long games are usually the loser's |
| `library` | **-2.14** | cards you still have are cards you never got to draw |
| `commanderTax` | **+9.36** (subtracted) | a commander cast four times is a commander that died four times |
| `counters` | **-2.75** | no story at all — which is its own warning about reading these |

Each is *true about positions* and *wrong about actions*. The distinction matters because a
weight is applied to exactly the choices those features describe: at `extraLands -4.64` against
`hand +2.51`, a land drop past the cap scores **-7.15** and the bot stops making land drops — the
same catatonic failure of finding 1, arriving by a completely new route.

The reason a one-ply search is *mostly* insulated is that it compares **sibling** states from one
decision point, where the "how far along, and how badly" part of a feature is near-identical
across siblings and cancels. What doesn't cancel is the part the action itself moves, and that's
precisely the causal direction a regression on outcomes cannot see.

So the fit is **constrained non-negative**, as projected gradient (clamped after each Adam step,
so the other coefficients adapt around the constraint rather than being truncated at the end).
That constraint is exactly the domain knowledge the all-positive `EvalWeights` convention already
encoded. A feature that ends pinned at zero is reported, because "the data wanted this negative
and was refused" is the shortlist of terms needing a scenario test or a rethink.
`--allow-negative` lifts it, for looking at what the data actually says.

**The scenario gate is what caught this**, and it's the argument for guard 3 in a sentence: that
70%-accurate vector fails "plays a land past the land cap", "recasts a taxed commander" and
"attacks when it is safe to" — and no win rate, against any opponent, would have said so. The
first two scenarios were written *because* the coefficients predicted them; the third was a
surprise. Both new scenarios pass on the shipped defaults.

### Three more guards, and what each one cost to find

Non-negativity alone wasn't enough. The constrained fit on the full 4000 games (168,574
positions, **72.0% holdout accuracy**, holdout ≥ train so nothing is overfitted) still failed the
gate. Each fix below rests on evidence *independent of the gate* — a structural argument or an
earlier measurement — because "the gate went red" is a reason to look, not a reason to exclude.

**1. Shrink toward the prior, not toward zero.** The L2 penalty now pulls each coefficient toward
the hand-picked value: ordinary ridge with a non-zero prior mean, saying exactly the right thing
here — the hand-picked vector holds causal knowledge the data can't see, so move away from it
only where the data insists. `--prior-l2` is the dial. It needs two passes, because a logistic
fit is in log-odds while the hand-picked vector is normalised to `life = 1` and an evaluation's
overall scale is free; the first pass exists only to learn the exchange rate. At `--prior-l2
0.02` this alone fixed "attacks when it is safe to" (the fit had `untappedCreatures` at 3.1 — a
creature that stayed home is one that wasn't forced to trade — so holding a blocker back
outscored attacking).

**2. `commanderTax` and `untappedMana` are excluded outright** (`PRIOR_ONLY`), fitted value
discarded and the hand-set one kept.

- `commanderTax` resisted even hard shrinkage (6.7 at `--prior-l2 0.08`). It isn't a description
  of a position — it counts how many times the commander has already *died*. And the cost it
  stands for is already charged where costs are charged: `Game.castingCostOf` folds the tax into
  the real mana cost (rule 903.8), so the spell is already unaffordable exactly when it should
  be. The evaluation term double-counts it, and unlike the mana cost it charges *every turn,
  forever* rather than once at cast time. This one is a bug in the feature, found by the fit.
- `untappedMana` the fit wanted at 1.66, up from a deliberate 0. At that value tapping seven
  lands costs 11.6 — more than a recast commander is worth — and the bot stops spending mana.
  Phase 1 already measured this term at a *sixteenth* of the fitted value, costing eight points
  of win rate at four players. The fit rediscovering it is confirmation, not news.
  `handManaValue` is the other half of that pair, and non-negativity already pins it to zero.

**3. The land-drop invariant, now enforced instead of commented.** A land drop scores
`lands - hand` (or `extraLands - hand` past the cap), so both land terms must stay above `hand`
or developing is a loss — which `evaluate.ts` has said in a comment since Phase 1 and nothing
checked. Non-negativity structurally cannot catch it: it bounds one coefficient at a time and
this is a *relationship between two*. With `extraLands` pinned at 0 against a fitted `hand` of
3.6, a land drop past the cap still scored -3.6. It was masked until fix 2 landed, because
`untappedMana` at 1.66 had been paying for the land drop by accident. The repair raises a short
land term to `hand` times the hand-picked vector's own `extraLands`-to-`hand` ratio, so the
margin is the prior speaking rather than a number invented in the fitter.

With all three, the fitted vector passes **9/9** scenarios.

### What the fitted vector actually measured

400 games against each gauntlet member, two players. The baseline's own row against
`baseline-2026-09-17` is a self-match and should read 50% — it measured 48.3%, which is the
noise floor of this bench: about ±2.5 points.

| opponent | baseline | position-fitted |
|---|---|---|
| v1 | 69.5% | **70.8%** |
| baseline-2026-09-17 | 48.3% *(self-match)* | **54.3%** [49.4, 59.1] |
| aggressive | 54.3% | **59.0%** |
| defensive | 53.8% | **61.3%** |
| ramp | 39.8% | **43.5%** |

Better against every member, so the gauntlet veto is clean — but head-to-head is 54.3% with the
interval touching 50%, which does **not** clear the acceptance rule. It is a plausible
improvement, not a demonstrated one. The honest reading is that a position fit with three
hand-built corrections lands about where the hand-picked vector already was.

**The result worth acting on is `ramp`.** It beats both bots by six to ten points, and it's a
hand-set style nobody tuned: `landCap` 12 against the shipped 7, real weight on `untappedMana`
and `permanentManaValue`. That is a direct contradiction of the Phase 1 ablation *and* of the
`untappedMana` exclusion above, and both can be true — Phase 1 measured turning the term on
inside an otherwise unchanged vector, while `ramp` changes the whole mana valuation together.
Worth its own bench before any more fitting.

### Sibling pairs: the right idea, and why it isn't working yet

The confound above has a structural fix. Rather than labelling a *position* with the game's
outcome, stop at a decision point, take two of the concrete actions available there, and label
which one led somewhere better. Both continuations descend from the same position, so everything
about how far along the game is cancels in the difference, and what's left is what the two moves
did. `bot:harvest --pairs` and `bot:fit --pairs` implement it: Bradley-Terry over the log-odds
difference of two sibling win rates, reusing the same standardization, prior and constraints.

**It is a working prototype and not yet a usable training set.** Three findings, each a trap:

1. **One playout per sibling yields nothing.** Over one game's 342 decision points, 236 offered a
   real choice and **3** ended with the siblings leading to different winners — 1.3%. A single
   move rarely decides a whole game, which is true of real Magic too.
2. **Reseeding the PRNG doesn't randomise a playout.** By mid-game the libraries are already
   ordered, so every future draw is fixed in the snapshot and twenty "randomised" playouts return
   twenty identical games. The variance has to come from reshuffling the libraries — which is
   also the better question, since it averages over what neither player can see.
3. **Common random numbers are mandatory, and they reveal the real problem.** Comparing siblings
   on *different* shuffles measures which drew better: on that data the shipped evaluator
   appeared to rank pairs correctly 13% of the time, which is an artefact, not a finding. Sharing
   the shuffles fixes it — and then **60 of 63 pairs come out exactly tied.** Given the same deck
   order, one move almost never changes who wins a full v1 playout.

The horizon is the culprit: a move's effect is measurable over two or three turns and is drowned
by twenty turns of v1's own noisy decisions. `--playout-turns N` truncates the rollout and scores
the leaf with the current evaluation, TD-style, which helps — at three turns, 9 of 78 pairs are
distinguishable rather than 3 of 63, and the evaluator agrees with them 67% of the time — but a
12% yield still isn't enough to fit on. Next to try: a longer truncation, more pairs per game,
and filtering decision points to ones whose candidates actually differ.

**Pairs and positions are complementary, which the prior machinery already composes.** Cancelling
the confound also cancels the signal for any feature a move doesn't move: on pair data `life`,
`library`, `commanderDamage` and `loyalty` are reported "never observed", because two candidate
moves usually leave all four identical. Pairs say what a *move* is worth and are structurally
silent on what a *state* is worth; positions are the reverse, and their silence is the worse
kind, since they answer confidently and wrongly. So the intended pipeline is
`bot:fit` for the base, then `bot:fit --pairs --prior-file base.json` to correct the terms moves
actually influence, leaving the rest where the position fit put them.

**And this is the answer to "should the evaluation be a neural network".** The infrastructure
built here — the feature split, the harvest, the gauntlet, the scenario gate — is what a network
would need and is model-agnostic. But the three confounds fought above are *not* a linear-model
problem; they're a training-signal problem, and a network trained on the same outcome-labelled
positions inherits every one of them while removing the interpretable coefficient that made each
one diagnosable. The cost argument is fine (a 29→32→1 MLP is ~1-2µs against feature extraction's
tens of µs, so essentially free next to what an evaluation already spends). The bottleneck is
the labels. Fix those first; a network is worth adding after, not instead.

**Negative weights remain representable.** `mutate` in `tune-bot.mjs` was made sign-preserving so
a hand-set or ES-discovered negative can't be silently flipped back.

**The known bias**, stated so nobody mistakes it for rigour: the positions are generated by the
policy being fitted, so this is one round of approximate policy iteration, not a clean supervised
problem. Positions inside one game are also correlated, which means the fit's own confidence
numbers are optimistic. Neither matters much because **nothing is decided by the fit's own
numbers** — a fitted vector still has to beat the incumbent head to head, clear the gauntlet, and
pass every scenario. Iterating (fit, play, refit) is the intended use.

The ES is not deleted. It keeps the five unfittable weights, and it's the natural way to polish a
fitted vector afterwards.

## The evaluation audit (before Phase 7)

Prompted by a simple question — *why* is `ramp` so much better? — and by the answer being
uncomfortable. `bot:audit` prices a permanent by spawning it on a fixed board and printing the
change in score, and checks whether the model bends where the game bends. Under the shipped
defaults:

| card | worth |
|---|---|
| Craw Wurm (vanilla 6/4) | **20.00** |
| Solemn Simulacrum | 9.00 |
| Grizzly Bears (vanilla 2/2) | 8.00 |
| Llanowar Elves | 5.50 |
| Forest | 4.50 |
| Thran Dynamo | 2.50 |
| **Phyrexian Arena** (a card every turn, forever) | **2.00** |
| Arcane Signet / Mind Stone | 1.50 |
| Lightning Greaves | 1.50 |
| **Sol Ring** | **1.00** |

The evaluation believes a vanilla 6/4 is **twenty times** a Sol Ring and **ten times** a
Phyrexian Arena. In a format where Sol Ring is banned-adjacent and a vanilla 6/4 is unplayable
filler, that is not a tuning error; it is the model being unable to represent the game. It also
explains `ramp` without any appeal to subtlety: `ramp` halves `power` and switches `untappedMana`
on, which is the only term that notices a rock exists.

**This is why tuning stalled.** A weight scales a curve; it cannot bend one, and it cannot
invent a feature that isn't there. Both the (1+1)-ES and the regression were searching a space
that does not contain a good evaluation.

### Gaps, in the order they're worth fixing

**Non-linear where the game is non-linear** — no weight can fix these.

1. **Mana.** The 2nd land is worth 4.50 and the 12th 2.50, a ratio of 1.8; it should be closer
   to 6. A one-mana dork on turn one is +50% of turn-two mana, and the same dork on turn nine is
   +11%. Marginal value proportional to the fractional gain is exactly `log(m)`, which also
   deletes `landCap` and `extraLands` — two weights and a threshold measured as doing nothing
   (landCap 7, 9 and 12 benched identically).
2. **Life.** Losing 5 at 8 life scores exactly the same as losing 5 at 40 — ratio **1.00**. The
   bot cannot tell "healthy" from "one swing from dead" except through the terminal loss term.
3. **Library.** Milling 10 off 12 cards scores the same as off 52 — ratio **1.00**.

**Features that do not exist at all.**

4. **Non-land mana.** `lands` filters on the land type, so rocks and dorks are generic
   permanents. This is the Sol Ring line above, and the single largest error found.
5. **Recurring card advantage.** Phyrexian Arena is priced as a 2-mana enchantment. Nothing
   distinguishes an engine from a vanilla permanent of the same cost, in the format where card
   advantage decides most long games.
6. **The commander itself.** No `isCommander` term: a commander on the battlefield is scored as
   an ordinary creature, despite being the one card always available and a 21-damage clock.
7. **Commander damage dealt.** `commanderDamage` counts damage *taken* only, so progress toward
   our own commander kill is invisible.
8. **Haste.** In neither `EVASION` nor `COMBAT_KEYWORDS`, so it is worth exactly zero.
9. **Colour and fixing.** No colour awareness anywhere; a five-colour deck's Command Tower is a
   Forest.
10. **Tempo.** No turn number, so "early" and "late" are the same to it.

### Phase 7: the rework

Agreed after the audit. The order is by measured impact, and each step keeps the scenario gate
and a bench at two *and* four players — `ramp` is dominant at two (78.8% vs v1) and exactly
average at four (25.0% against 25% even), which is a standing warning that a two-player result
is not a result.

1. **Mana as one concave feature.** `manaProduction` — everything that makes mana, lands, rocks
   and dorks alike — scored through `log(1 + m)`, replacing `lands`, `landCap`, `extraLands`.
   `manaHeldUp` stays linear and separate, since holding up instant-speed interaction is a
   genuinely different thing from having a big mana base.
2. **Concave life and library**, for the same reason and by the same method.
3. **Card advantage**, as a term for permanents with a recurring draw trigger.
4. **The commander**: a term for having it on the battlefield, and one for commander damage
   dealt.
5. **Haste**, into the keyword list.
6. Re-fit, re-gate, re-bench. Colour/fixing and tempo stay deferred — both are real, both are
   much harder, and neither is likely to be worth a point of win rate next to the above.

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
5. **Tune.** Fit the weights by logistic regression over harvested self-play positions at two
   players, then validate at four on held-out seeds and seatings — scored against a gauntlet
   of opponents, never v1 alone (see "Not just beating v1" and "Fitting the weights from
   self-play"). The (1+1)-ES keeps the five weights a linear fit can't speak to.
6. **Ship.** `Room.addBot` seats `EvalBotController` once it passes the gauntlet at both two
   and four players, passes every scenario test, and its worst-case decision time fits the
   think pause. From then on rooms record bot game results (see below).

### Phase 6 notes: the decision time budget

The thing that kept the bot out of live rooms was never its strength — it was that
`maxSimulations` bounds **work, not time**. A simulation's cost grows with the board: on a
four-player board of 200+ permanents one end-of-turn rollout is ~400ms, so ten candidates is 4s
and the 200-simulation ceiling is over a minute. Measured worst cases were 2s at two players and
14s at four, against a room's 350ms think pause.

`EvalBotOptions.timeBudgetMs` is a wall-clock ceiling on one decision, threaded through the
priority search, the combat hill-climb and the mid-resolution decision search as a shared
`SearchBudget { left, until }`. Three things about it are deliberate:

- **Off by default.** A clock breaks the engine's determinism guarantee — same seed plus same
  controllers no longer replays identically, because a busier machine searches less. The tests,
  the fuzzer and the tuner all depend on that, so the budget is opt-in and only `Room.addBot`
  opts in. `bot:bench --bot-options '{"timeBudgetMs":300}'` measures it when wanted.
- **Candidate order is what makes it safe.** An expired search plays the best candidate found
  *so far*, so what gets scored first decides how it degrades. `pass` is scored first (it was
  already the baseline) and then v1's own pick, which is pulled to the front of the enumerated
  list. The floor is therefore "passing or v1's move, whichever actually measured better" —
  a policy worth degrading to — rather than whichever card `legalActions` happened to emit
  first. Without that reordering an expired search would have been *worse* than v1.
- **300ms, a shade under `BOT_MIN_THINK_MS`.** The room already pauses 350ms after each bot
  action so clients can animate it, and the search runs inside that pause, so a search that
  finishes first costs nothing visible.

### Phase 1 notes: the features, and what the defaults cost

Done. `evaluate.ts` now carries every term in the list above except poison, which the engine
doesn't model; summoning sickness is deliberately absent, because the evaluation runs at the
end of a turn and sickness always wears off before its controller could next attack.
`untappedCreatures` (blockers left home) stands in for it. Each term has an isolating unit
test in `eval-bot.test.ts`. `bot:bench --weights '{...}'` overrides any weights for a run, and
the tuner's mutation can now switch a zero weight on (and a vanishing one off).

Adding the terms at hand-picked defaults was neutral at two players (65.8%) and cost ten
points at four (36.0% -> 26.0%). Ablations, 200 four-player games each on identical seeds:

| run | result |
|---|---|
| all new terms off | 36.0% (72W-128L — identical to before the rewrite, so the refactor is exact) |
| board terms only: evasion, keywords, permanent mana value, loyalty, counters | 38.0% |
| resource terms only: commander damage/tax, graveyard, energy, monarch, emblems | 34.0% |
| hand mana value, untapped mana/creatures, land cap only | 28.0% |
| any one of those off, everything else on | 27.0–28.0% |
| hand mana value and untapped mana off, `extraLands` 2.5 (**shipped**) | 32.5% |

The culprits share one failure: they make *spending* look bad. A sorcery cast from hand gives
up its `handManaValue` with nothing on the board to replace it; every land tapped costs
`untappedMana`; and with `extraLands` (1) below `hand` (2), a land drop past the cap scored as a
loss, so the bot stopped playing lands in exactly the long games where it needs them. The
shipped defaults switch the first two off and put `extraLands` above `hand`. The remaining gap
to 36% is inside the noise, and closing it by hand is what the tuner is for.

### Phase 2 notes: combat as built

Done, following "Combat: the alpha strike and crackback" below, with these specifics:

- **Combat simulations** (`simulateCombat`) play a declaration through blocks and damage
  with every seat a `CombatRolloutController` — v1's answer to any decision, a pass at every
  priority window. The priority search's stand-ins still never block (Phase 3).
- **Attacks** climb from no attack, one attacker/defender pair at a time, scored by the
  evaluation *after* the simulated combat; the result is compared with v1's all-out swing.
  Crackback is read off that post-combat state, so the creatures the combat is expected to
  kill are already gone from both sides.
- **Blocks** climb from v1's blocks (which already chump when facing lethal) with moves that
  add a blocker, add a menace pair, or take a block back.
- **Only the promising moves are simulated.** A four-player block with 19 attackers and 5
  blockers took 4.2s simulating every pair from two starting points. Moves are now ranked by
  cheap arithmetic (damage stopped or dealt, creatures killed) and the top 8 per round
  simulated: 198ms on that position, with no measurable strength change.
- **Alpha at a multiplayer table** still has to survive the remaining opponents' crackback,
  since killing one player doesn't end the game.
- `crackbackParanoia` (0.5) and `crackbackMargin` (2 life) live on `EvalWeights` so the tuner
  can move them.

| | before | combat |
|---|---|---|
| 2 players, 400 games | 66.3% | **69.5%** [64.8, 73.8] |
| 4 players, 200 games | 32.5% | **48.2%** [41.4, 55.2] vs 25% even |

**Known, for Phase 6:** four-player games can reach 200+ permanents (seed 35 reached 224),
where a single end-of-turn priority rollout costs ~400ms and a decision with ten candidates
takes 4s. That game overruns the bench's 300s timeout. It's the priority search's rollout cost
on an enormous board, not combat, and it's what the think-time budget has to solve.

### Phase 3 notes: the rollout policy

Done. `simulateAction` takes a `RolloutPolicy` (`EvalBotOptions.rollout`, `bot:bench
--rollout`): `passive` (the old `AutomaticController` stand-ins — never attack or block),
`combat` (every seat attacks and blocks as v1 does, still passing at every priority window),
or `defensive` (v1's blocks everywhere, but our own seat never attacks, since v1's all-out
swing is a poor stand-in for the bot's own attacks).

| policy | 2 players, 400 games | 4 players, 200 games |
|---|---|---|
| passive | 69.5% | 48.2% |
| **combat** (default) | 70.3% [65.6, 74.5] | **51.5%** [44.6, 58.3] |
| defensive | 70.5% [65.9, 74.8] | 50.0% [43.1, 56.9] |

None of the three is distinguishable from the others at this sample size, and none costs
measurable time. `combat` is the default because it's the right model — a creature cast
before combat now visibly attacks in the rollout, and a decision on an opponent's turn sees
their attack coming — and it has the best four-player point estimate, not because the bench
proves it better. It's a real knob for the tuner to revisit, alongside the weights.

### Phase 4 notes: decisions mid-resolution

Done. v1's answers to the decisions the engine asks mid-resolution were placeholders: the first
legal target (its own creature, often), decline every "you may", take the minimum from a tutor
(nothing, for "up to"), sacrifice whatever's listed first, never scry a card away.
`bot/decisions.ts` now generates the candidate answers — trigger targets, modes and "you may"
(with `{X}` at its maximum or zero), sacrifices, discards, choosing from a zone, scry/surveil,
clone choices, shock-land life, the commander zone replacement — and `EvalBotController` plays
each out like a priority move, v1's answer the one to beat and the winner of ties. Mulligans,
combat damage order and assignment, naming a creature type and changing text keep v1's answer.

- **One level of lookahead.** A trigger's target is worthless if the "you may" after it is
  declined, and in the rollout v1 declines. So our own seat in a decision's rollout is a
  `DecisionRolloutController`, which searches any further decision itself (with plain v1
  beneath it). Without this the Overseer of the Damned test chose its own bear.
- **Budgets multiply, so they're small.** Windreader Sphinx ("whenever a creature with flying
  attacks, you may draw") on a board of flyers raised a decision per attacker, each rollout
  containing the rest; at the priority search's budget one answer took 11.5s. A decision now
  gets 12 rollouts, and each of those 2 for anything nested (exactly a "you may"'s yes and no).
  Capped lists are tried most promising first: a tutor's highest mana value, a sacrifice's or
  discard's lowest.
- **Not in priority rollouts by default.** `rolloutDecisions` puts the same controller in our
  seat for *priority* rollouts too, so casting an "enters, you may…" creature is scored as if
  we'd accept. It measured 70.5% / 53.5% against 69.5% / 53.0% without, at 75% more time and
  two four-player timeouts, so it's off.

| | 2 players, 400 games | 4 players, 200 games |
|---|---|---|
| Phase 3 | 70.3% | 51.5% |
| **Phase 4** | 69.5% [64.8, 73.8] | 52.0% [45.1, 58.8] |

No measurable change against v1 — which is the benchmark's blind spot rather than proof the
work is idle: v1 makes the same placeholder choices, and the positions where they matter
(a removal trigger, a tutor, an edict) are a small share of a game. The scenario tests are
what hold this phase to account. A gauntlet opponent that answers these well is what would
show it in the numbers.

### Not just beating v1

A tuner optimizes exactly what it's scored on. Scored only against v1 it will find whatever
v1 is bad at — v1 attacks with everything and never holds back blockers, so a vector that
punishes that would look superb and could be worse against anything else, including itself
and people. Four guards, cheapest first. **1-3 are built**; 4 waits on Phase 6.

1. **A gauntlet, not a benchmark.** Fitness is the result against a pool of frozen opponents:
   v1, every weight vector that has ever been accepted or shipped (each checked in under
   `engine/src/bot/champions/` with its date and bench numbers), and a few deliberately
   different *styles* — hand-set `aggressive`, `defensive` and `ramp` vectors — so no single
   opponent's weaknesses dominate. A candidate is accepted only if it beats the incumbent head
   to head **and** doesn't regress against any gauntlet member (no member where its interval
   sits wholly below the incumbent's own result against that member). Head-to-head stays the
   primary signal; the gauntlet is the veto. The veto profile is measured once for the starting
   incumbent and thereafter inherited from whichever candidate was accepted — that candidate's
   numbers are already in hand, so an acceptance costs one gauntlet sweep rather than two.
   `bot:bench --opponent gauntlet` runs the same sweep on its own.

   Each champion writes out the **whole** `EvalWeights` literally rather than spreading
   `DEFAULT_WEIGHTS` and overriding a few keys. A gauntlet member whose weights drift when the
   defaults change isn't a fixed point to measure against, and every bench number recorded
   against it would silently become a lie. Adding a weight is meant to break compilation there:
   the right value for a term a champion predates is a judgement call, not something to inherit.
2. **Mixed tables.** At four players the candidate sits with a mix — incumbent, v1, an older
   champion — rather than three copies of one opponent, which is closer to a real pod and
   stops it learning to farm one policy. The list is exactly one spec per opponent seat, and the
   incumbent always takes one of them: a longer list would rotate the incumbent out of some
   blocks entirely, and its being at every table is what makes this the primary signal. The list
   rotates once per *block*, never inside one, so a block still holds everything but the
   measured seat constant.
3. **Scenario tests that don't depend on any opponent** (`engine/src/bot/scenarios.ts`,
   `bot:scenarios`, and `test/eval-bot-scenarios.test.ts` against the shipped defaults).
   Hand-built positions with a known right answer: play a land, play a land *past the land cap*,
   remove the biggest threat rather than the smallest, don't tap mana for nothing, recast a
   taxed commander, take lethal when it's on board, don't swing into a lethal crackback, *do*
   swing when it's safe, chump-block only against lethal. They're parameterised by a weight
   vector, so the same suite gates a candidate.

   This is the one measurement that can't be gamed by exploiting whatever the benchmark
   opponents are bad at, and it matters far more now that weights are fitted rather than
   hand-picked: a regression will happily find a coefficient that *predicts* winning for a
   reason that has nothing to do with causing it. The suite isn't vacuous — the `aggressive`
   champion fails the crackback scenario, which is exactly what that style is for. They grow
   every time a live game shows a bad play.
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

`eval-bot-combat.test.ts` covers the combat arithmetic and the decisions mid-resolution.

`eval-bot-scenarios.test.ts` runs the opponent-independent suite in `bot/scenarios.ts` against
the shipped defaults, and guards the gauntlet's own invariants: every champion carries every
weight literally, ids are unique and dated, no two champions are the same vector, and
`FEATURE_KEYS` names exactly the linear terms of `EvalWeights` and no others.

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

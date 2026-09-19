# Bot v3 — rollout search over sampled worlds

Status: **built and seated.** The search, the determinizer and `PlanBotController` are all in
`engine/src/bot/`, and `Room.addBot` seats v3 in live rooms. The **Sequencing** steps from
"Re-run `bot:audit`" onwards are still outstanding — the evaluation has not been re-fitted for a
search that now actually casts things, which is the likeliest cause of the measurement below. It supersedes the search architecture in
`docs/plans/smarter-bots.md` (v2, one-ply + linear evaluation), which stays as the record of how
we got here and why several of its decisions have to be undone.

This document exists because v2's tuning stalled, twice, for the same reason: **the architecture
could not represent the strategy we were trying to tune it into.** Writing it before touching
code is deliberate — two rounds of weight tuning were spent compensating for defects that no
weight could fix.

## Measured after seating it: v3 skips about one land drop in eight

Playing v3 in a real `Room` against a seat that only passes, ten games of two players over the
five precons, counting every priority window where a land drop was legal. Measured under
`pacing: "immediate"`, which is the one that isolates the *search* — a separate room bug was
asking every bot for its move twice and eating v3's plan two entries at a time, and these numbers
are unchanged by fixing it:

| bot | land played | passed with a land in hand |
|---|---|---|
| v2 | 43 | 0 |
| v3 | 42 | 6 |

So roughly 12% of v3's land drops are declined outright, and what a person sees across the table
is an occasional turn where the bot does nothing at all. It is *not* the catatonia of the early
prototype — v3 develops a board and attacks harder than v2 over the same games — and it is not
the budget either: the same six recur unchanged at a 6s plan budget as at 1s. It is the search
concluding that holding the land is worth as much as playing it, which is exactly the shape of
the **tie trap** below, and exactly what an evaluation fitted against a rollout that never cast
anything would be expected to get wrong. Fix it with the re-audit and re-fit in **Sequencing**,
not with a special case for lands.

## The two measurements that decide this design

**1. A rollout never casts anything.** Every v2 rollout policy — `passive`, `combat`,
`defensive` — passes at every priority window, for *every seat including our own*. With eight
untapped Forests and two creatures in hand, a full end-of-turn rollout produces an empty board:

| rollout | cost | nonland board after | score |
|---|---|---|---|
| passes (v2, all three policies) | 1.26ms | `[]` | 24.0 |
| v1 actually plays the turn | 2.18ms | `["Craw Wurm", "Grizzly Bears"]` | 48.0 |

So every candidate action is scored as *"I do this, and then nobody does anything else all
turn."* Mana is never spent. Cards in hand are inert. **Nothing can be valued for what it
enables, only for what it is.**

**2. The evaluation therefore prices the game wrongly, and had to.** `bot:audit` on the shipped
defaults: a vanilla Craw Wurm is worth **20.00**, a Sol Ring **1.00**, Phyrexian Arena **2.00**.
A vanilla 6/4 is twenty times a Sol Ring. That is not a tuning error — the Wurm genuinely *is* 20
points of static board, and the Sol Ring's entire value is enablement the rollout refuses to
simulate. The feature set was being asked to price potential that the search threw away.

These two are one defect seen from both ends. Fixing the evaluation without fixing the rollout
would be hand-tuning numbers to compensate for a simulator we deliberately crippled.

## Every rule v2 accumulated, and whether it survives

v2 was built under a hard constraint that no longer applies: a decision had to fit inside a
350ms think pause. Almost every questionable choice traces back to that. The constraint is now
explicitly lifted — the site has two users, and a slower, better bot is preferred to a faster,
worse one.

| Rule | Why it existed | Verdict |
|---|---|---|
| One-ply search | Cheap | **Overturned.** v2's own "Deferred" section calls MC rollouts and ISMCTS strictly stronger, deferred *only* for cost. |
| Horizon = end of turn | Cheapest point past the stack | **Overturned.** See "Depth" below. |
| Rollout seats must not recurse into the searching bot | Real: `tick()` calls `act()` | **Requirement kept, fix rejected.** The requirement is *bounded depth*. "Stand-ins that pass" is what broke everything. |
| Combat is never enumerated | `(defenders+1)^creatures`; ~1M on a real board | **Kept.** Combinatorial, not budgetary. |
| `maxSimulations` 200; decisions get 12 rollouts | Time | **Overturned**, re-derived below. |
| **The bot reads real hands and library order** | Determinization was "substantial extra work" | **Overturned.** See "Determinization". |
| Evaluation is a linear weighted sum | Speed | **Deferred.** Deeper rollouts reduce what the evaluator must carry. Decide after re-auditing, not before. |
| All weights positive | Protects the ES's multiplicative mutation | **Overturned** with the ES. It forced fitted coefficients to be clamped, distorting the fit. |
| `landCap` / `extraLands` piecewise curve | Hand-invented | **Overturned.** Measured inert — `landCap` 7, 9 and 12 benched identically (54.8 / 55.0 / 55.0). |
| `handManaValue` and `untappedMana` are harmful | Phase 1 ablation, and the Phase 5 fit agreed | **Void, not overturned.** Both were measured inside a rollout that never spends mana. The measurement has no content; re-run it. |
| v1 is the benchmark opponent | It existed first | **Overturned.** Every number we have is shaped by one weak opponent's weaknesses. |
| The five precons are the test population | They were there | **Overturned.** `ramp` scores 78.8% at two players and 25.0% at four — a standing warning that results may be artifacts of five midrange decks. |
| A decision must fit 350ms | `BOT_MIN_THINK_MS` | **Softened.** The frame/ack machinery already tolerates arbitrary delays; a 2–3s bot with a thinking indicator is fine. A bound still exists, it is just much larger. |
| Determinism for tests and the fuzzer | Real debugging value | **Kept.** Determinization draws from a seeded RNG, so replays stay exact. |
| Gauntlet and scenario gates | Guard against opponent-overfit | **Kept, with scepticism.** Two of nine scenarios had false positives on first contact; they are hand-made assumptions and get audited like everything else. |

## The architecture

**Turn-plan search, evaluated by depth-limited rollouts over sampled worlds.** The bot builds a
plan for its whole turn, scores it by playing it out and then rolling `D` turns of policy past it
across `K` sampled completions of the hidden information, and hill-climbs to a better plan.

*(The first draft of this document said "for each candidate action" rather than "for each plan".
That was measured wrong within the hour — see "The tie trap is fatal to one-ply" below. The
rollout and determinization machinery is unchanged; what changed is what gets searched.)*

That one change does most of what the Phase 7 feature list was invented to do:

- Mana is **spent**, so ramp pays off without being priced abstractly.
- Engines **tick** — Phyrexian Arena draws three cards inside the horizon instead of needing a
  proxy feature for "recurring card advantage".
- Opponents **respond**, so a play walking into a removal spell can be seen doing it.
- Averaging over sampled worlds is the variance control the pair-label experiment lacked.

### Determinization, and why it is not optional

v2 reads `ControllerView.state`, the real un-redacted `GameState` — opponents' hands and library
order included. v3 samples instead: pool each opponent's hand and library, shuffle, deal back the
hand size we can legitimately see, and shuffle our own library (we know its contents, not its
order).

Three separate things this buys, which is why it is the centre of the design rather than a
tidiness exercise:

1. **Strength measured becomes strength against people.** A bot that never has to guess looks
   better in self-play than it plays against a human, and *nothing* in v2's numbers distinguishes
   the two. Expect the honest bot to measure weaker; that drop is information, not a regression.
2. **It is the variance mechanism the rollouts need anyway.** A single playout of a 3-turn future
   is one sample of a very noisy variable.
3. **It makes hidden-information play possible at all.** Holding up a counterspell, playing round
   a likely wrath — none of it is expressible when you can just look.

**Common random numbers are mandatory.** Every candidate at one decision must be evaluated
against the *same* `K` sampled worlds. This is not a refinement; it is the difference between
signal and noise, and v3 gets to skip learning it the hard way because v2 already did: comparing
two sibling moves on different shuffles made the shipped evaluator appear to rank them correctly
**13%** of the time, an artefact that vanished entirely once the draws were shared.

### Depth

`D` counts *player turns*, not rounds, and the default should be `players + 1` — far enough to
come back round to ourselves, so a play, every opponent's answer, and our follow-up all sit
inside the horizon. At two players that is the 3 turns this design is named for.

Open: whether depth should shorten as the board grows (rollout cost scales with board size), and
whether the last turn should be truncated at end-of-turn rather than played fully.

### Rollout policy — now the binding constraint

v1 (`HeuristicBotController`) for every seat, as v2's `combat` policy already does — except that
our own seat now *plays* rather than passing.

The honest risk, stated up front: **deeper rollouts mean more policy noise.** Three turns of v1
making mediocre decisions can drown the thing being measured. This is exactly what killed v2's
sibling-pair labels, where 60 of 63 pairs came out tied because a single move rarely survives
twenty turns of v1.

**Confirmed, on the first position inspected.** Casting a Stormfist Crusader scored 21 points
worse than not casting it. Reading the end states (`bot:plan` prints them, which is why it
exists) the line is: the Crusader is cast, v1 attacks it into a board with a 2/2 and an anthem,
it dies, and its symmetric "each player draws" trigger has meanwhile given the opponent a card.
The 21 points are real *given that rollout*, and the rollout is v1 misplaying. A competent player
holds the 2/1 back as a blocker.

So the search's ceiling is now the policy's competence, and that is a different problem from the
one v2 had. Two ways out, in order of cost: a better rollout policy (a greedy-evaluation player
rather than v1), or more sampled worlds so policy variance averages out — which does *not* help
here, because this is policy **bias**, not variance. Averaging cannot fix a policy that is
reliably wrong in the same direction, which is the argument for fixing the policy first.

### The tie trap is fatal to one-ply, and this is the measurement

The first draft of this document predicted that under a completing rollout `pass` would stop
meaning "do nothing" and start meaning "let the policy play my turn", so a decent policy would
tie with most single actions. The fix proposed was to make v1's action the baseline instead of
`pass`.

**That was far too mild.** Measured at a real turn-8 position (11 candidates, depth 3, `playing`
policy, one sampled world), the end states are not merely close — they are *identical*:

```
  IDENTICAL  pass-priority
  differs    cast-spell obj-128
  IDENTICAL  cast-spell obj-154
  IDENTICAL  play-land obj-169
  IDENTICAL  activate-ability obj-132 #0
  IDENTICAL  activate-ability obj-132 #1
  IDENTICAL  activate-ability obj-165 #0
  IDENTICAL  activate-ability obj-165 #1
  IDENTICAL  activate-ability obj-167 #0
  differs    activate-ability obj-167 #1
  differs    activate-ability obj-167 #2
```

Eight of eleven candidates produce the same battlefield, the same hand size and the same life
totals. Scores: seven at exactly -21.1, two at -22.1, one at -22.3.

The reason is structural, and obvious in hindsight: **within one turn the order of most plays
does not matter, and a greedy policy plays the whole affordable set regardless of which action
you force first.** So forcing an action changes nothing the policy wasn't going to do anyway. The
only candidates that separate are the ones v1 *wouldn't* take, and they separate by being worse.

A completing rollout therefore does not fix one-ply search; it **empties it**. The search
degenerates to "avoid the three moves the policy rejects". And the opposite extreme — v2's
passing rollout — is uninformative in the mirror-image way, since nothing is ever spent. Neither
end of the dial works, which means the dial is the wrong control.

### The correction: the turn is the unit of decision, not the priority window

The information the search needs is not "which action first" — it is **which set of plays to make
this turn**, with their targets, plus the attack. Delegating that set to a policy and searching
the ordering searches the part that doesn't matter.

So the bot should construct a **turn plan**: the sequence of actions it intends to take this
turn. A plan is scored by playing it out and then handing to the policy for the opponents' turns
and our later ones, `D` turns deep, averaged over the sampled worlds. The search is a hill-climb
over plans — add a play, drop a play, swap a target, change the attack — which is exactly the
shape the combat builder already uses and for the same reason: the space is far too large to
enumerate and greedy-incremental is close enough.

Every decision that actually matters becomes visible under this model:

- **Which subset**, when mana won't stretch to everything — two plans, different contents.
- **Targets** — two plans, same play, different target.
- **Holding up mana** — the plan that deliberately omits a play, which is finally expressible.
- **Sequencing**, where it genuinely matters (a cost reducer before the thing it reduces).
- **Combat**, folded into the plan rather than searched separately.

It is also *cheaper*. A plan is searched once per turn rather than at every priority window: a
hill-climb of 10–20 plan evaluations, times `K` worlds, times ~6ms is roughly 0.6–1.2s **per
turn**, against v2's per-window cost repeated a dozen times a turn.

The engine calls `act()` once per priority window, so the controller plans at the first window of
its turn and then executes the plan action by action — replanning when the state diverges from
what the plan assumed, which is what an opponent responding looks like. Plan-and-execute with
replanning is a standard shape and it is also, not coincidentally, what a human does: look at the
hand and board, decide the turn, play it out.

**Baseline and ties** still matter under this model, but they get easier: the baseline is v1's
whole turn (the plan the policy would have produced), and a searched plan has to beat it. Ties go
to v1.

### Budget

Extrapolating from the measurement above (2.18ms for a one-turn playing rollout): roughly 6–7ms
for three turns, times `K` worlds, times the candidate count. At `K=5` and ten candidates that is
~350ms per decision — affordable even under v2's old ceiling, and comfortable under a relaxed
one. `timeBudgetMs` stays as the live safety valve with a much larger value, and keeps its
existing guarantee: on expiry, play the best candidate found so far, having scored v1's move
first.

## Open questions, with the answers I'd start from

| Question | Starting answer | How it gets settled |
|---|---|---|
| How is a plan represented and replanned? | A list of actions, re-derived whenever the state diverges from what the plan assumed | The first thing to build; the replanning trigger is the fiddly part |
| What plan moves does the hill-climb make? | add a play, drop a play, swap a target, change the attack | Mirror the combat builder, which already works |
| `K`, the number of sampled worlds | **3 — settled, see below** | Swept |
| `D`, the depth | **`players + 1` — settled, see below** | Swept |
| Rollout policy | v1 everywhere | Compare against a greedy-evaluation policy once one exists |
| Does the evaluator stay linear? | Yes, for now | **Re-run `bot:audit` after the rollout change.** Several current prices are rollout artifacts, and the feature list must be re-derived from the new numbers, not the old ones |
| Fixed-depth or MCTS? | Fixed-depth first | MCTS needs rollouts and determinization as substrate; this builds both. Revisit once they exist and are measured |
| What replaces v1 as benchmark? | The shipped v2 vector, plus the gauntlet | Champions already exist for this |
| Deck population | Widen beyond the five precons | The deck builder and a 630-card pool can generate more |

## The sweep, and what the rollout is actually worth

### Worlds and depth: a clean negative result

400 games each at two players, 1.5s budget, one axis at a time from (3 worlds, depth 3):

| worlds | depth | vs v1 | game | worst turn |
|---|---|---|---|---|
| 1 | 3 | 69.7% [65.0, 74.0] | 5.9s | 1.9s |
| 3 | 3 | 71.5% [66.9, 75.7] | 10.0s | 6.6s |
| 5 | 3 | 70.4% [65.8, 74.7] | 11.4s | 7.0s |
| 8 | 3 | 67.2% [62.4, 71.6] | 12.7s | 4.8s |
| 3 | 2 | 71.5% [66.9, 75.7] | 8.1s | 3.4s |
| 3 | 5 | 67.2% [62.4, 71.6] | 11.9s | 13.0s |

**Every interval overlaps every other.** Neither knob measurably changes strength anywhere in this
range, so both are chosen on cost: `worlds` drops from 5 to 3, and depth stays at `players + 1`
on the principle that a full lap of the table is the meaningful horizon, since the data has no
opinion.

The weak trend is worth reading, though. More worlds *and* more depth both drift **downward**,
and the reason is that the budget is fixed: precision per plan is bought with plans explored, and
exploring more plans looks like the better trade. That also disposes of the "scale worlds down on
huge boards" idea from the open questions — the cheapest setting is already the best one
measured, so there is nothing to scale down to.

### What the rollout prices that the evaluation couldn't

`bot:audit --rollout` prices a card two ways: by the static evaluation, and by playing the next
few turns out. The gap between the columns is the enablement a static score structurally cannot
see.

| card | static | rollout |
|---|---|---|
| **Sol Ring** | 1.00 | **9.00** |
| **Arcane Signet** | 1.50 | **9.50** |
| **Thran Dynamo** | 2.50 | **12.00** |
| Forest | 4.50 | 12.50 |
| Solemn Simulacrum | 9.00 | 12.50 |
| Llanowar Elves | 5.50 | 7.00 |
| Grizzly Bears | 8.00 | 11.50 |
| Phyrexian Arena | 2.00 | 2.95 |
| Mind Stone | 1.50 | 2.00 |
| Lightning Greaves | 1.50 | 2.00 |
| Craw Wurm | 20.00 | 31.50 |

**The mana gap is closed, and by the architecture rather than by a feature.** A Sol Ring goes from
a twentieth of a vanilla 6/4 to comparable with a Forest, which is what it is: a land that isn't a
land. No `manaProduction` term was needed, which retires most of the Phase 7 feature list exactly
as this plan predicted.

**Colour came free too.** Mind Stone prices at 2.00 against Arcane Signet's 9.50, and both are
2-mana rocks — the difference is that Mind Stone makes `{C}`, which cannot cast the `{1}{G}`
creatures in the audit's hand. The rollout sees mana *colour* requirements, which the feature set
has no term for at all and which the audit had listed as gap 9.

Two gaps survive, and they are now cleanly separated:

- **`power` is far too high.** A vanilla Craw Wurm at 31.50 is still three times a Sol Ring. That
  is a *weights* problem, not an architecture one — and `ramp`, which halves `power`, has been
  saying so since it beat everything at two players. It is now fixable by tuning, because the
  search no longer distorts what tuning would measure.
- **Card-advantage engines are still mispriced.** Phyrexian Arena at 2.95 is a quarter of a
  Grizzly Bears, because a depth-3 rollout sees one or two of its upkeep triggers and `hand` pays
  2 a card. This is the one Phase 7 feature that survives the rework — or it wants more depth,
  which the sweep says costs strength.

## Sequencing

Each step is measured before the next starts, because the whole lesson of v2 is that unmeasured
steps compound into a design nobody can debug.

1. **Determinization + `D`-turn rollouts**, behind a flag, defaults unchanged. Measure cost.
   *(Done. `determinize.ts`, `simulate.ts`'s `playing` policy and `simulateTurns`, and
   `bot:rollout-cost`. A depth-3 rollout is 5–11ms depending on board size, so a plan hill-climb
   at K=5 costs roughly a second per turn. The same measurement is what exposed the tie trap.)*
1b. **Turn-plan search**, replacing the per-window candidate search. *(Built: `plan.ts`,
   `plan-bot.ts`, `bot:plan`, `bot:bench --bot v3`, `bot:scenarios --bot v3`. It separates where
   per-action search collapsed — an empty plan, a land plan and a land-plus-spell plan score
   -8.4, -2.3 and -23.1 on the position where eight of eleven actions had been identical. Passes
   9/9 scenarios and benches 73.8% [69.2, 77.8] against v1, to v2's 72.0% — ahead on the point
   estimate, overlapping intervals, so **not yet a demonstrated improvement**. Live rooms still
   play v2.)*

   Three bugs found on the way, each worth remembering because none showed up as a crash:

   - **Planning at the wrong window.** The first priority window of our own turn is in the
     *upkeep*, where sorcery speed isn't available and nothing is castable, so the plan came out
     empty — and an empty plan means "pass the whole turn". The bot lost 0-4 against v1 while
     finishing games in half a second, because it was doing nothing at all. Plans are built in a
     main phase.
   - **Append-only neighbours.** The climb could add a play but never change one, so with v1's
     plan as the seed the bot was stuck with v1's targets. It scored "kill the 6/4" at -8.1 and
     "kill the 2/2" at -24.1 and then played the 2/2 kill, because swapping wasn't a move it
     could make. `planNeighbours` now appends, swaps and drops.
   - **A threshold applied between candidates.** `MIN_GAIN` was folded into the running
     comparison, so a neighbour 0.6 better than the incumbent beat a later one 0.9 better. It is
     now applied once, against the incumbent, after the best neighbour is picked.

1c. **A planning time budget.** *(Done.)* Swap-and-drop neighbours are `|plan| x |frontier|` per
   round, and the worst planned turn measured **87 seconds**. Now **6.4s worst, 38ms mean**, with
   no strength cost — four runs across the change land at 71.8-73.8%, all inside each other's
   intervals — and a 400-game bench halved, 526s to 254s.

   Four things were needed, and the budget itself was only one of them:

   - **`planBudgetMs` defaults on** (1.5s), unlike v2's `timeBudgetMs`, because what it prevents
     is not a slow game but an unusable one. Unit tests pass `Infinity` where exact replays
     matter more than a bounded turn.
   - **Neighbour ordering carries the budget's weight.** A round offers far more neighbours than
     the budget will pay for, so whatever is evaluated first is what the search actually
     considers: appends (an unevaluated append is a play simply not made), then swaps earliest
     position first, then drops.
   - **The stop is predictive, not reactive.** Stopping when time has run out overshoots by a
     whole evaluation, which is `worlds` rollouts and on a wide board is seconds — measured 6.5s
     against a 1.5s budget. It now stops when there isn't time for a *whole* evaluation, judged
     from the running mean. Aborting *inside* one would be tighter and is wrong: a plan scored on
     one sampled world isn't comparable with a plan scored on three, and the search depends on
     every plan seeing the same worlds.
   - **Degradation is to v1's turn, never to passing.** When the budget is gone before v1's plan
     can even be scored, that plan is adopted *unscored*. Keeping the empty plan instead would
     mean passing the whole turn, so a slow board would become a skipped turn — the same
     catatonic failure in new clothes. Verified down to a 0ms budget.

   **The remaining floor is one unconditional evaluation.** Scoring the empty plan has to happen
   to have a baseline at all, and on the widest boards that alone is ~6s. Bounding it needs
   `worlds` or `depth` to scale with board size, which is already an open question above rather
   than a new one.
2. **Re-run `bot:audit` and the gauntlet.** Card prices will move; some Phase 7 features may stop
   being necessary and others may appear. *Do not touch the feature set before this.*
3. **Re-derive the feature set** from the new audit.
4. **Re-fit**, with the all-positive constraint gone and `handManaValue`/`untappedMana`
   re-measured from scratch.
5. **Widen the measurement setup** — more decks, v2 as benchmark, 2p and 4p always reported
   together.
6. **Decide on MCTS**, with rollouts and determinization already in hand.

## What gets deleted

- `landCap` and `extraLands` — measured inert.
- The all-positive weight convention, and the clamping in `fit-weights.mjs` it forced.
- `RolloutPolicy`'s `passive` and `defensive` variants, unless they survive as ablations.
- v1-as-benchmark as the default in `bot:bench`.

## What is kept from v2

Not much of the search survives, but the *scaffolding* is most of the value and all of it stays:
`features.ts`'s feature/weight split, `bot:harvest` and `bot:fit`, the frozen `champions/`
gauntlet with its regression veto, the opponent-independent `scenarios.ts` gate, `bot:audit`, and
the block-structured deck seating that makes any of it measurable. Every one of those is
architecture-agnostic, and the scenario gate in particular is the only measurement in the project
that cannot be gamed by an opponent's weaknesses.

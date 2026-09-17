# Bot v3 — rollout search over sampled worlds

Status: **design, not started.** Nothing here is built. It supersedes the search architecture in
`docs/plans/smarter-bots.md` (v2, one-ply + linear evaluation), which stays as the record of how
we got here and why several of its decisions have to be undone.

This document exists because v2's tuning stalled, twice, for the same reason: **the architecture
could not represent the strategy we were trying to tune it into.** Writing it before touching
code is deliberate — two rounds of weight tuning were spent compensating for defects that no
weight could fix.

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

**Depth-limited rollout evaluation over sampled worlds.** For each candidate action: sample `K`
plausible completions of the hidden information, play each forward `D` turns under a policy,
evaluate the leaf, average. Take the best average.

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

### Rollout policy

v1 (`HeuristicBotController`) for every seat, as v2's `combat` policy already does — except that
our own seat now *plays* rather than passing.

The honest risk, stated up front: **deeper rollouts mean more policy noise.** Three turns of v1
making mediocre decisions can drown the thing being measured. This is exactly what killed v2's
sibling-pair labels, where 60 of 63 pairs came out tied because a single move rarely survives
twenty turns of v1. Determinization averaging is the mitigation and it needs *measuring*, not
assuming — if `K` has to be large for the signal to clear the noise, the cost multiplies and a
better rollout policy becomes the cheaper fix.

### What the baseline is, and the tie trap

Once a rollout completes the turn, **`pass` stops meaning "do nothing"** — it means "let the
policy play my turn". A decent policy then ties with or beats most single actions, and since ties
are skipped, the bot would pass its whole turn while the rollout showed it playing. This is the
same defect that let v2 decline land drops when `extraLands == hand`, one level up.

So the baseline is **v1's own action**, not `pass`, and ties go to v1. A search that finds nothing
better plays v1's move, which is also the degradation floor the live time budget already relies
on.

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
| `K`, the number of sampled worlds | 5 | Sweep 1/3/5/10; watch decision variance and win rate together |
| `D`, the depth | `players + 1` | Sweep 2/3/5; expect a noise ceiling |
| Rollout policy | v1 everywhere | Compare against a greedy-evaluation policy once one exists |
| Does the evaluator stay linear? | Yes, for now | **Re-run `bot:audit` after the rollout change.** Several current prices are rollout artifacts, and the feature list must be re-derived from the new numbers, not the old ones |
| Fixed-depth or MCTS? | Fixed-depth first | MCTS needs rollouts and determinization as substrate; this builds both. Revisit once they exist and are measured |
| What replaces v1 as benchmark? | The shipped v2 vector, plus the gauntlet | Champions already exist for this |
| Deck population | Widen beyond the five precons | The deck builder and a 630-card pool can generate more |

## Sequencing

Each step is measured before the next starts, because the whole lesson of v2 is that unmeasured
steps compound into a design nobody can debug.

1. **Determinization + `D`-turn rollouts**, behind a flag, defaults unchanged. Measure cost.
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

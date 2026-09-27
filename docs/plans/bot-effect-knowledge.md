# Bots that know what their cards do (v2 on an effect-aware base)

Status: **in progress** (2026-09-26). Decided after a fresh analysis of all three bots and a
survey of other card-game AIs: keep improving **v2** (`EvalBotController`, what live rooms seat),
give it the one layer every successful MTG AI has and ours doesn't — knowledge of which side of
the table each effect belongs on — and retire v3. This is not a new search. The search, the
evaluation, the combat builder, the gauntlet and the scenario gate all stay.

## What was measured

An instrumented self-play harness counted what the bots actually do, window by window: 40
four-player all-v2 games at the live 300 ms budget (`timeBudgetMs: 300`), 40 all-v1 games, a few
constructed positions, and four-player benches. Precon decks, Commander rules, mulligans on.

| | v2 (seated) | v1 |
|---|---|---|
| Targeted picks aimed at the wrong side (harm at its own side, help at an opponent's) | 11% (105 of 939; 77 had a right-side option) | 22% (173 of 783) |
| Targeted offers with more legal target combinations than v2's 8-combination cap | 27% (1,629 of 6,098) | — |
| Bot CPU spent where passing was the only move it would consider | 34% | — |
| Searches over the 300 ms budget (priority / attack-block / other decisions) | 7% / 15% / 10%, max 640 ms | — |
| Own turns ending with a castable spell unplayed that v1 would have cast | 7.4% | — |

Roughly a third of v2's wrong-side picks are the classifier being wrong (Brash Taunter fighting
its own creature is a real combo; exiling a card from your own graveyard is harmless). The rest
are visible blunders, about 1.5 per four-player game: Generous Gift and Beast Within on its own
lands, Garruk Wildspeaker untapping opponents' lands, Drakuseth's attack trigger hitting its own
side, +1/+1 counters on opponents' creatures, Absorb countering its own spell.

### Three causes, all in parts every bot shares

1. **v1 takes the first legal target.** `legalTargets` lists the players in turn order, then the
   battlefield oldest-first, so the first option is often the bot itself or its own oldest
   permanent. v1 pacified its own creature on every test board, Murdered its own Grizzly Bears,
   Beast Withined its own Forest, and cast Negate, Sinister Sabotage and Absorb on its own spells
   (any spell on the stack is a legal target, and v1 casts the dearest affordable spell). v1 is
   v2's fallback, the first candidate v2 scores, the blocker in every combat simulation, the
   inherited answer to every decision v2 searches, and v3's entire rollout policy.
2. **v2 only ever looks at the first 8 target combinations, in that same order**
   (`MAX_TARGET_COMBOS` in `bot/candidates.ts`; decisions stop after 12 rollouts). On a turn-3
   four-player board, Beast Within and Generous Gift had 16 legal targets and the real threat —
   the newest permanent — was number 16. The 8 v2 could see were all lands, so it passed. Late in
   a game those 8 are still the oldest lands, and trading your own spare land for a 3/3 scores as
   a gain, which is where the own-land Generous Gifts came from.
3. **The evaluation doesn't price "can't attack or block".** `power`, `toughness` and
   `evasivePower` count a pacified creature in full; only `untappedCreatures` notices it can't
   block. Pacifism on the bot's own tapped creature scored *better* than not casting it (−7.5
   against −8.5), and only 0.5 below pacifying the opponent's 6/4. Where the evaluation can't tell
   two targets apart, the tie goes to v1's pick. This is the Aura report in BACKLOG
   ("Hand-labelled target polarity").

### A prototype says the fix is worth more than any weight ever was

A 100-line polarity-aware patch over v1 — hurt the opponents' most valuable permanent, help our
own best, never cast something whose only legal targets are on the wrong side — cut v1's
wrong-side picks from 22% to 1% (the remainder all classifier false positives) and benched
**32.8% [28.3, 37.5] against three plain v1s at four players** (400 games, even 25%). The
largest weight change ever measured here was `power`'s +5.8 points.

And 74% of the pool's 1,771 targeted slots (on 1,652 cards) classify automatically from the
effect vocabulary. The rest fall mostly into four buckets a rule settles: bounce (160 slots,
by the zone it returns from), Equip and Aura moves (104, already restricted by their target
spec), reanimation (52 — the best card in any graveyard is the one to take) and mill (47).

### v3, and why it is retired rather than re-fitted

v3 had a bug that made it cast at most one spell a turn. After a spell is cast its caster
receives priority with the spell on the stack (rule 117.3c); `PlanBotController.act` then walked
the rest of its plan, found nothing castable at instant speed, *consumed* every entry, and passed
for the rest of the turn. Holding Forest, Grizzly Bears, Llanowar Elves and Centaur Courser with
mana for all of them, v1 and v2 play all four; v3 planned all four and played the Forest and the
Courser. The rollout-side `PlanController` has the same walk, and the planner's frontier was
captured at that same stack window, so the search could only ever append instants after a
spell. It is also the likelier explanation for "v3 skips one land drop in eight" in
`bot-v3-search.md` than the tie trap: a plan with the land after a spell loses the land.

Patched (wait while the stack is busy; capture the frontier and build the plan only at an empty
stack) and re-benched at four players against three v2s, 100 games each:

| | vs three v2s (even 25%) |
|---|---|
| v3, fixed | 16.0% [10.1, 24.4] |
| v3, fixed, with the polarity-aware v1 under it | 24.0% [16.7, 33.2] |

So parity at best, at several times v2's compute: at four players its 1 s plan budget buys ~3-6
plan evaluations a turn past turn 11 (`bot:census`). A better rollout policy is worth ~8 points
to it, which confirms `bot-v3-search.md`'s warning that its ceiling is the policy's competence.
But the same policy work lifts v2 directly, at no extra cost per decision.

## What other card-game AIs do

- **Forge**, the most mature open-source MTG AI, is hand-written rules, not trained. About 150
  per-effect AI classes (`DestroyAi`, `PumpAi`, `CounterAi`, `AttachAi`…) each decide whether an
  effect is worth using and whom it should hit — `PumpAi` puts buffs on its own creatures and
  curses on the opponents', and skips pumps that can't change a combat. Strong with aggro and
  midrange, weak with control, poor with combo, by its own wiki.
  ([wiki](https://github.com/Card-Forge/forge/wiki/AI),
  [ability AIs](https://github.com/Card-Forge/forge/tree/master/forge-ai/src/main/java/forge/ai/ability))
- **forge-mtgx** added a look-ahead on top of Forge's AI on 2026-09-25 that is nearly v2 with
  sampled worlds: Forge's own move, pass and a few more, each played out with Forge's AI on every
  seat and scored by a static evaluator, ties to Forge. It reports 57.3% [53.1, 61.5] against
  Forge's default AI. ([PR #10](https://github.com/lborthwein/forge-mtgx/pull/10))
- **Cowling, Ward & Powley (2012)** ran MCTS with an ensemble of determinizations on a simplified
  MTG with fixed decks. It only reached *parity* with a hand-built expert rules player, at 10,000
  simulations per decision; naive MCTS won 23% against that player; weaker randomized rollouts
  beat expert ones; the expert rules player won 42% against humans.
  ([paper](https://eprints.whiterose.ac.uk/id/eprint/75050/))
- **Hearthstone**: competition winners (2018-20) searched the current turn and scored it with an
  evaluation function; the field's survey says MCTS is "very hard to use effectively beyond a
  single turn given the partial observability", and MetaStone's agent and the Silverfish bot
  search only to the end of their own turn. ([survey](https://arxiv.org/pdf/1907.06562))
- **Legends of Code and Magic** was won three years running by own-turn search with tuned
  heuristics; move ordering, pruning and lethal detection mattered most, and predicting the
  opponent's hand *hurt*. Deep RL won only once cards were randomly generated, in a far smaller
  game. ([summary](https://arxiv.org/html/2305.11814))
- **RL and LLM play of full-rules Magic** is research-stage: Gym benchmarks over a few Standard
  archetypes, and LLM harnesses on XMage (mage-bench) with no published results. Hundreds of
  decisions a game rules an LLM out for live play; labelling card data offline is a fair use.

v2's shape — search to the end of your own turn, score the board — is the one that wins
elsewhere. What it lacks is Forge's layer.

## The plan

Each step is measured with the behaviour harness (fast, and it measures what a person watching
sees) and, where strength could move, benched at four players. Steps 1-4 change v2 directly;
none of them changes v2's search.

1. **Hygiene.** v2 stops simulating a pass when nothing else is on offer (a third of its CPU);
   one wall-clock deadline covers a whole attack or block declaration, and the search stops
   predictively instead of overrunning by a whole simulation. The room memoizes a bot's legal
   actions for the question it asks. Count-based budgets are untouched, so every seed replays as
   before.
2. **Target polarity** (`engine/src/target-polarity.ts`). For every targeted slot of a spell,
   activated ability, triggered ability or Aura: *harm* (bad for whoever controls the target),
   *help*, *take* (the best target wherever it is — reanimation, a copy), or *either*. Derived
   from the effect tree through a table total over `EffectSpec["kind"]`, so a new effect kind
   fails the build until someone says which side it belongs on; the strongest effect on a slot
   decides (exile-and-gain-life is harm, draw-and-lose-life is help). Auras read their `attached`
   statics. A slot whose target spec already names the side ("creature you control") is not
   second-guessed. A small override table covers what the vocabulary gets wrong. Lives outside
   `bot/` so decision modules may use it.
3. **v1.5.** `HeuristicBotController` picks targets by polarity and a cheap static value (a
   creature's stats, a planeswalker's loyalty, a card's mana value) instead of the first legal
   one, hides offers whose only legal targets are on the wrong side, and does the same for
   trigger targets and an Aura that enters without being cast. It is v2's fallback and combat
   stand-in, so v2 improves without being touched.
4. **v2's candidates.** Target options are ordered by polarity and value before the cap, for
   spells, abilities and trigger targets, so the eight combinations v2 simulates are the eight
   worth simulating. Wrong-side options go last rather than away: Brash Taunter fighting its own
   creature is right, and only the search can tell.
5. **Evaluation.** A creature that can't attack or block loses its combat value; `lifeDanger`
   swept with a lower `life` so two life at 40 costs less than a card (Sign in Blood scores
   exactly zero today, and ties go to passing); and the `smarter-bots.md` Phase 7 terms that v3
   was meant to make unnecessary — mana production, draw engines, the commander on the
   battlefield, commander damage dealt. Each additive at weight zero, swept at four players.
6. **Measurement.** The harness becomes `bot:behaviour`. The scenario gate grows a case for each
   failure above, at four players where the failure needs a wide board.
7. **Retire v3**: `bot/plan.ts`, `plan-bot.ts`, `determinize.ts` (unless v2 takes up sampling),
   `test/bot-plan.test.ts`, the `bot:plan`, `bot:census` and `bot:rollout-cost` scripts,
   `BOT_PLAN_BUDGET_MS`, and the v3 paths in the scenario, harvest and tune workers and in
   `room-pacing.test.ts`.

Not planned: a worker thread for the bots (v2's 300 ms fits the think pause it already hides
in; revisit only if a budget grows), learned evaluation (after 2-5, over the polarity and role
features they add), and difficulty levels (v1.5 is a respectable easy bot when someone asks).

## Progress

**Step 1, done (2026-09-26).** v2 lists its candidates before simulating anything and passes
without a rollout when there are none; the time budget stops predictively after its two
baselines; one budget covers a whole attack declaration, v1's swing scored first; the room
works a bot's legal actions out once per question. Count budgets are untouched, and a seeded
check bore that out: six two-player games with no time budget replayed move for move
identically on the old build and the new, with dead and mana-only windows ~10x cheaper (5.1 ms
to 0.4 ms), every other kind of window unchanged, and whole games 34% faster. Under the live
300 ms budget at four players, attack and block declarations over budget fell from 23% to 8%.
The first version of the predictive stop could stop *before* v1's move was scored when the
passing baseline alone was slow — 79 windows in 24 games that passed where v1 would have acted
— which is why it now waits for both baselines.

**Step 2, done (2026-09-26).** `engine/src/target-polarity.ts`. With a rule for every effect
kind rather than the prototype's shortlist — bounce read by the zone it returns from, Equip and
reanimation and mill given sides, removal outranking its consolation — **98.6% of the pool's
1,771 targeted slots classify** (967 harm, 764 help, 15 take, 25 either), against the
prototype's 74%. So no labelling page: what's left is a transform, an animated land, a suspect,
which really are the board's call. There is no override table yet; the first card the
vocabulary gets wrong in a way that matters will start one.

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
8. **Weights fitted to scenarios** (added 2026-09-27, the user's suggestion). Hand-built
   positions with a known right answer, many more of them, and the question each one asks of
   the weights: what would they have to be for v2 to get it right, and what would that break?
   Then bench the vector those answers add up to. This is comparison training — Deep Blue's
   evaluation tuned to agree with grandmasters' moves, Bonanza's (MMTO) with professionals' —
   rather than `bot:fit`'s regression on who won, which found `power` at 2.03 where play peaked
   at 0.5.

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

**Step 3, targeting done (2026-09-26).** `HeuristicBotController` aims casts, activations,
trigger targets, an Aura entering uncast and a Clone's copy by polarity and `targetValue`, and
leaves alone anything whose only legal targets are on the wrong side. Benched against the
unaimed v1 of the baseline build, three of them at four players, 400 games: **30.0% [25.7,
34.7]** (even 25%), in line with the prototype's 32.8%. One difference from the prototype is
deliberate and untested: it valued a player target at 100 minus their life, so burn always went
face; `targetValue` puts a healthy opponent's face below a real creature and a dying one's above
it. Still to do in v1.5 proper: "you may", sacrifices, discards and which ability to activate.

**Step 4, done (2026-09-26).** v2 ranks each slot's options by polarity and value before the
cap (`aimOffer`), for spells and abilities and for trigger targets; the scenario gate gains
"removal finds the threat on a wide four-player board" (eight older creatures, two of them the
bot's own, before carol's 6/4 — without the ranking v2 killed one of carol's Bears). With
steps 1, 3 and 4 together, on the same 24 four-player seeds at the live 300 ms budget, v2's
wrong-side picks fell from **48 of 489 (9.8%) to 11 of 570 (1.9%)**, four of those classifier
artifacts (a spec-forced opponent target, exiles from its own graveyard) and the rest choices
its search made with the right side ranked first.

**What steps 1-4 are worth in strength** — the new v2 against three copies of the v2 seated
before this work began (the baseline build at `cfbf98be`), four players, count budgets:
**28.6% [24.1, 33.6] over 339 games** (even 25%). The first 199 games read 30.7% and the next 140
25.7%; the run was stopped there, because step 5 is benched against a fresh baseline anyway. So
a few points at most. These steps were fixes to what a watching player sees — wrong-side targets,
wasted CPU — and they bought that; strength is the evaluation's job (step 5).

**Step 5, first finding (2026-09-26): modal spells were cast wrong, not valued wrong.** The
card v2 most often left in hand at the end of its turn was Clan Defiance, and not because the
evaluation disliked it. A targeted modal spell ("choose one or more —") got exactly one candidate:
every fillable mode at once, each aimed at its first legal target — X damage to its own flyer, its
own creature and itself — and, in both v1 and v2, **cast without an X, which the engine reads as
0**. Now v2 tries each choice of modes (as many as allowed, each alone, then the rest, capped at
eight) with each mode's targets ranked and X at its maximum, and v1 leaves out a mode it could only
aim at its own side and passes its X.

**Step 5, the terms (2026-09-26).** Each term went in additive at zero and was benched against
three copies of the vector it would replace (`shipped-2026-09-23`), four players, 400 games, count
budgets, even 25%:

| Weights changed | Result |
|---|---|
| `nonlandMana` 1, `drawEngines` 2, `commanderOnBoard` 2, `idlePower` 0.5 | 26.0% [21.9, 30.5] |
| `life` 1 → 0.5, `lifeDanger` 0 → 1 | 24.8% [20.8, 29.2] |

Neither is a strength result. 400 four-player games resolve about four points either way, and
a term that decides the odd game moves the win rate by less than that; what the runs rule out is
a loss that size. So the weights that ship are the ones a scenario shows fixing something a
player would see, and the rest stay at zero:

- **`idlePower` 0.5**, equal to `power`, which it exists to cancel for a creature that can't
  attack. At zero, v2 enchanted its own tapped Craw Wurm with Pacifism whenever that was the only
  legal target: the Aura is a permanent for a card (+0.5 against `hand`) and nothing the
  evaluation counted was lost. An untapped Wurm before combat never showed it — the rollout plays
  the combat and sees the attack go — which is why the scenario's first draft passed at zero and
  the gate's version taps the Wurm.
- **`life` 0.5 with `lifeDanger` 1**, so a point of life costs 0.5 above 15 and 1.5 below, for
  opponents as for the bot. Read the Bones and Sign in Blood, two cards for themselves and two
  life, scored exactly zero with every point worth half a card, and ties go to passing: in 24
  four-player games Read the Bones was the third card v2 most often ended its turn holding. It now
  casts them down to 17 life, and two scenarios pin both halves (cast at 40, hold at 5).
- **`nonlandMana`, `drawEngines` and `commanderOnBoard`** stay at zero for a sweep to find a
  peak, if one exists. Commander damage *dealt*, the fourth Phase 7 term, needed none: the
  evaluation subtracts opponents' features from ours, so the commander damage an opponent has
  taken already counts in the bot's favour.

`shipped-2026-09-26` freezes the result.

In games, on the same 24 four-player seeds with count budgets (`bot:behaviour --weights`, old
vector against new): turns ending with a sorcery-speed spell castable and unplayed fell from 53 of
1,063 (5.0%) to 36 of 1,075 (3.3%) — Read the Bones held 11 times to 1, Sign in Blood 5 to 1. The
price of cheaper life shows in the same list: Fireball held 3 times to 7, Act of Treason 0 to 4,
since damage to a healthy opponent is now worth half what it was. Holding a Fireball against 40
life is defensible; the bench saying it costs nothing measurable is why it ships anyway.

The list of cards v2 ended its turn holding had one more that no weight fixes: Vandalblast, which
at four players v2 casts only on the leader's artifacts, because a trailing opponent's score is
averaged with the other's and counted at a quarter. That is a question of whose threat matters,
not of a term's size; it is in BACKLOG ("Removal only for the leader").

**Step 6, the script done (2026-09-26).** `npm run bot:behaviour -w engine` is the harness this
plan's measurements came from, rebuilt on the engine's own `target-polarity.ts`: wrong-side
targets (and whether a right-side one was legal), own turns ending with a sorcery-speed spell
castable and unplayed (and which cards), skipped land drops, and time by kind of window against
the room's budget. A few dozen games answer what a win rate needs hundreds for, and say why.

**Step 6, done (2026-09-27).** The gate gained a scenario for each measured blunder a position
can pin: Drakuseth's attack trigger at four players (before the ranking, v2 put the 4 damage on
alice herself), Ajani's +1/+1 counter on a wide board (it saw only opponents' creatures, and
passed) and Absorb with only its own Divination on the stack. Run against the v2 from before this
plan (`cfbf98be`), the first two fail and pass now; the third passes on both, since the evaluation
already prices it, but fails for any vector that values three life above two cards (at `life: 5`
v2 counters its own draw spell). Two blunders got no scenario. Garruk's untap can't be posed:
v2 always prefers his −1 Beast to the +1, so no position reaches the untap's targets. And Beast
Within on its own land didn't recur in the positions tried: ranked last, its own lands fall past
the eight targets simulated.

**Step 7, done (2026-09-26).** v3 is retired: `plan.ts`, `plan-bot.ts`, `bot-plan.test.ts`,
the `bot:plan`, `bot:census` and `bot:rollout-cost` scripts, `BOT_PLAN_BUDGET_MS`, and the
`--bot` flag of the bench, tune, harvest and scenario scripts. `determinize.ts` and `simulate.ts`'s
`"playing"` policy stay: `bot:audit --rollout` prices cards with them, and sampling is how v2
would stop reading hands if that is ever worth its noise (Legends of Code and Magic found
predicting the opponent's hand not worth its cost).

**Step 8, the machinery (2026-09-27).** A priority window's rollouts never read the weights (v1
plays every seat in them), so a scenario can be recorded once — every answer v2 simulated, the
state each rollout reached read into features, and the judge's verdict on each — and replayed
under any vector as plain arithmetic: `scoreOutcome`, the same function `evaluateState` now is,
the first of any tie played (`bot/scenario-fit.ts`; `EvalBotOptions.trace` reports the answers).
A test replays every recorded scenario under the shipped weights and requires the bot's own
choice; with ties sent to the last answer instead, four of those go red. A decision's replay is
close rather than exact (a decision inside its rollout is searched with the weights), so every
result is also played for real. `npm run bot:fit-scenarios -w engine` then asks each scenario
the weights get wrong what one weight alone would take to fix it — the nearest value that does,
and what that change breaks — and tunes by hand: the cheapest lever that breaks nothing, one
scenario at a time, each found against the vector as it stands, since levers interact.

The corpus: the gate grew from 16 scenarios to 33, most of them counterweights — seven
development positions (Sol Ring, a Signet, a two-drop, Cultivate, Divination, Phyrexian Arena, a
six-drop), a Counterspell for a six-drop, an edict, a wrath when behind and none when ahead,
Lightning Bolt at a creature and at a lethal face, a combat trick, Beast Within with only lands
to hit, the leader's threat before a trailer's, and a mill trigger at an opponent rather than
oneself. Without them a fit fixes a scenario about holding cards by pricing every card in hand
up and stops casting Sol Ring, whose margin at the shipped weights is half a point. Four
**training** scenarios hold right answers the shipped weights get wrong:

| Training scenario | What v2 does | Levers that break nothing |
|---|---|---|
| Save Counterspell for a threat, not bob's Arcane Signet | counters it, by 1.0 | none: every one stops a development scenario |
| Kill the commander one hit from lethal commander damage | kills the bigger Craw Wurm, by 2.45 | `commanderOnBoard` 0 → 3 |
| Discard the extra land, not the Craw Wurm | a tie, broken toward the Wurm | `handManaValue` 0 → 0.05 |
| Kill a trailing player's Craw Wurm when the leader has none | holds, by 0.58 | `otherOpponents` 0.25 → 0.38; or `power`, `permanentManaValue`, `toughness` ×3 |

The Counterspell scenario is the finding: no weight prices an answer's option value, and
whatever would (`handManaValue`, `untappedMana`, a lower `otherPermanents`) also stops the bot
casting its rocks and draw spells. A feature, not a weight. By hand, the three levers came to
`handManaValue` 0.05, `otherOpponents` 0.5 (0.38 no longer cleared the margin once the first was
pulled) and `commanderOnBoard` 3 — all 33 gate scenarios and 3 of 4 training ones right, played
for real. A joint fit (`--joint`, coordinate descent over every free weight) is kept but not
trusted on a corpus this size: its first try used `graveyard` 0.05 → 1 as a discount on casting,
since every spell cast lands in its caster's graveyard (the mill scenario now rules that out),
and later ones cut `power` from the 0.5 the four-player sweep chose to 0.15 for margins nothing
needed.

**Step 8, the hand-tuned vector (2026-09-27).** Benched against three copies of the shipped
vector, four players, count budgets: **26.8% [22.7, 31.4] over 399 games**, level (even 25%). By
step 5's rule — a fix a scenario shows, and a bench that rules out a loss — it ships, frozen as
`shipped-2026-09-27`, and the three scenarios it fixed move from training into the gate (36
there; the Counterspell one stays in training). The 400th game ran past the bench's 25-minute
limit, the first timeout in any of these benches, and replaying it found a slow game rather than
a hung one: dave activating Lathliss, Dragon Queen's "{R}: Dragons you control get +1/+0" a dozen
times and more a turn off a pile of Treasures, each activation a full search of a
seventy-permanent board at eight to ten seconds. v1 caps any one ability at four activations a
turn; v2 has no cap (BACKLOG). The new weights only steered that game there — replayed with the
old ones, the same seed ends at turn 38.

In games (`bot:behaviour`, count budgets, 48 four-player seeds, the old vector against the new on
each): turns ending with a sorcery-speed spell castable and unplayed went from 91 of 2,260 to 81 of
2,254; Vandalblast was held 9 times to 5, Fireball 10 to 5, Act of Treason 4 to 0. One new habit
came with it: wrong-side targets with a right-side one legal went from 12 to 23, nine of the new
ones an opponent's attacking creature pumped (Kessig Wolf Run, Fires of Yavimaya, Unleash Fury,
Ajani's counter), which the old vector never did. That is `otherOpponents` working as set —
damage one trailing opponent deals another now counts double what it did — on mana the
evaluation prices at nothing (`untappedMana` is 0), so pushing someone else's attack costs the bot
nothing it can see. A real multiplayer play, and an odd one to watch; BACKLOG has it. (The
first 24 seeds alone read 8 wrong-side picks to 19, the next 24 read 18 to 18: which games a
vector steers into moves these counts as much as the vector does.)

**Step 3, v1.5's other choices, done (2026-09-27).** `engine/src/effect-worth.ts` is the other
half of target polarity: what an effect is worth to one player once its targets are chosen, as a
coarse signed number (a card about 2, a point of life a quarter of one above 15 and three
quarters below, removal 4), read off the targets through `slotStrengths` and off the player scope
for the kinds nearly every optional clause is made of. v1 now takes a "you may" or pays a
punisher when that beats what declining lets happen, takes a modal choice's best modes, sacrifices
its cheapest permanent (a token below a card), discards surplus lands and what its board can't
cast soon, and activates the ability worth most, never one worth less than nothing.

What changed, read off 40 four-player v1 games with the old v1 asked every question beside the
new: 690 disagreements, nearly all the intended ones. Draws, life, tokens and land searches the
old v1 declined (Windreader Sphinx, Sangromancer, Isperia, Emeria Angel, Solemn Simulacrum);
Rhystic Study's {1} paid; Titan Hunter no longer fed its own Windreader Sphinx and commanders for
a point of life, 40-odd times; edicts paid in tokens. One misread turned up and was fixed:
exiling a card from a graveyard read as `exile`'s decisive removal, so Scavenging Ooze's nibble
outranked Vitu-Ghazi's token. The same comparison for v2 (the old build's v2 asked beside the
new, six full four-player games): 22 disagreements, about four a game — Isperia's draws taken,
Rakdos Charm on an opponent's Bident rather than passing, Dawn of Hope's {2} kept when short —
and nothing a watching player would call a blunder.

In strength, level. The new v1 against three old v1s: **26.7% [23.7, 29.8] over 800 games**
(even 25%). v2 on the new v1 against three v2s on the old: **21.8% [17.1, 27.2] over 254
games**, stopped there, before the Ooze fix, once the decisions had been read one by one and
shown nothing systematic; it shipped on those decisions rather than on the bench, which didn't
rule out a loss. The bench's one refused action was an engine bug, fixed alongside: a convoke
offer's proof could tap a green mana creature for generic that a mana-affordable cost needed for
its colour (Hour of Reckoning with Avacyn's Pilgrim), so a driver echoing it was refused the
cast; a mana-affordable offer now carries no proof.

**After the plan: seed 50 (2026-09-27).** The one game of the step-3 A/B bench that ran past its
25-minute limit, replayed and read turn by turn from a snapshot of its turn 40 (alice's tenth).
Three things kept it from ending, each found only once the one before was fixed:

- **One search per activation.** Lathliss, Dragon Queen's "{1}{R}: Dragons you control get
  +1/+0" and Scavenging Ooze's "{G}: Exile target card from a graveyard" were each a full search
  of a seventy-permanent board per activation, ~30-45 s at count budgets. v2 now also tries an
  ability as a batch (as many activations as the mana allows, one candidate; a targeted one both
  at the same target and at a new one each time) and plays the rest of a chosen batch without
  searching, then holds its pass while the stack resolves. The same hold covers the window after
  its own spell and every window after it passed, until something new lands. v1's four-a-turn
  cap wasn't copied: with the mana for it, twelve pumps is right, and the batch lets the search
  say so at the cost of one decision.
- **Treasures counted without end.** With Old Gnawbone and Atarka, every pump made eighteen more
  Treasures off a player already dead, each worth `otherPermanents` (2): +640 a batch, forever.
  Identical noncreature tokens past four now go to `extraTokens`, at 0 — any positive weight
  keeps that loop profitable. The champions carry their old `otherPermanents` there, so they
  score exactly as they did.
- **What's left is size.** With both fixed the game ends, alice winning on her tenth turn, 15.5
  minutes after it began: a turn of ten spells at ~33 s a search. Not benched; shipped on the
  replay, and on the decisions read along the way. Still open, in BACKLOG: mana spent in the
  upkeep on a pump that only matters in combat.

**After the plan: pump timing and twin targets (2026-09-27).** An until-end-of-turn pump, keyword
grant or animation is no longer a candidate where it can't matter — outside combat, outside the
bot's own first main phase, with nothing on the stack — for v1 and v2 alike. Read with
`bot:diff` against the build before it, over six four-player games: 18 of 13,875 decisions
changed, every one of them that waste — the live v2 had been casting Unleash Fury on an
opponent's creature in its own upkeep, three turns running, and activating Kessig Wolf Run for
X=6 there. And twin targets, tokens nothing tells apart, are one option before the candidate
cap (`bot/twins.ts`, on the token fold's own key): seven Treasures are one simulation.

**After the plan: a threat to me (2026-09-27).** The evaluation weighed each opponent by where
they stood — the leader at `opponent`, the rest averaged at `otherOpponents` — and nothing in it
asked whose creatures were pointed at the bot. So v2, with Murder in hand while a trailing player
attacked it with a Craw Wurm, killed the leader's identical Wurm at home and took six ("kills the
creature attacking it, not the leader's", now in the gate). The attack itself is invisible where a
search scores a move — at the end of the turn, when nothing is attacking any more — so the game
now remembers who last attacked whom (`PlayerState.lastAttackedBy`, public information), and a
subtracted `threat` feature counts opponents' creatures by the combat damage they could turn on
us: in full from a player who attacked us within the last round, split across their opponents
otherwise, and as a share of what we have left to lose (life, or a commander's remaining 21,
whichever is nearer — so Anafenza three short of lethal commander damage still outranks a bigger
Wurm). `bot:fit-scenarios` found the lever at 1.5, breaking nothing; `bot:diff` against the build
before showed that as removal-happy (a Fireball on a Cat token over Phyrexian Arena), so the term
was scaled by life and shipped at 1.0, where the scenario flips at ~0.66. At 1.0, 44 of 14,532
decisions changed over six four-player games: more favourable blocks and chump blocks at low
life, removal on the creatures that mattered, and more sweepers — the one thing left to watch
(BACKLOG). Frozen as `shipped-2026-09-27b`. Not benched.

**After the plan: a Counterspell's reserve (2026-09-27).** v2 countered an opponent's Arcane Signet
with its only Counterspell, and no weight on the old terms held it without also stopping the bot
casting its rocks and draw spells. A new feature, `answers`, counts the counterspells in the bot's
own hand (anything whose spell, or one of its modes, counters a spell), so casting one gives up a
reserve on top of the card: the bot counters only what's worth more than that. Measured at four
players before the reserve, countering was worth 0.4 against a Sol Ring, 0.9 a Signet, 1.85 a
Divination, 2.35 a Cultivate, 4.6 a Grizzly Bears, 11-13 a Craw Wurm, Serra Angel or Shivan
Dragon, and 26.8 a Wrath of God on three of our creatures; `answers` ships at 3. Rhystic Study
scored 1.4, below a Divination, because `drawEngines` stood at 0: the user's point was that it's
almost always worth a counter, so `drawEngines` goes to 4 (5.4 to counter one). Three gate
scenarios pin it: saves Counterspell for a Signet, counters a Rhystic Study, lets a Divination
through; each fails without its weight. `bot:diff` against the build before, six four-player games:
28 of 11,693 decisions changed, all from `drawEngines` (no starter deck plays a counterspell) —
draw engines cast ahead of creatures (Greed, Dawn of Hope, Midnight Reaper, Elemental Bond),
removal and Cleansing Nova aimed at opponents' engines, an Abrade held rather than spent on a Sol
Ring, and an edict answered with the commander over Mentor of the Meek. Frozen as
`shipped-2026-09-27c`. Not benched.

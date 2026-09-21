# The decision registry

Status: **shipped** (steps 1–17 of 19). Step 18 (the client PR) is written and
parked on the `client-attack-fix` branch pending a browser check; step 19
(`RandomController`'s arms) is optional and not started.

## The problem

Every player decision in this engine is a dispatched action, never a
synchronous callback. There are 17 of them, and each was answered by the same
five steps spread across five independent if-chains in four files:

| file | what it held |
|---|---|
| `game.ts` `legalActions` | a `LegalAction` projection per kind |
| `game.ts` `whyCannot*` | a validator per kind |
| `game.ts` `dispatch` | an apply arm per kind |
| `controller.ts` `answerAwaited` | an "ask a controller" arm per kind |
| `bot/decisions.ts` | a candidate enumerator per kind |

Nothing tied the five together. Adding one decision kind (commit `e7ad1af`,
proliferate) touched **11 source files across all three workspaces**, and the
only thing that failed the build when you forgot one was an accident:
`discard` happened to be the implicit fallthrough of two of those chains, so a
new `AwaitingDecision` variant broke on a missing `count` property several
hundred lines from the mistake.

## The shape

One module per kind under `engine/src/decisions/`, owning the **answer half**
and nothing else: its offer, its validator, its controller arm, its bot
candidates, and the per-kind predicates (`hasSource`, `mayAct`, `autoAnswer`).

**`apply` does not move.** It is a one-line call through `DecisionHost`, which
is `dispatch`'s existing switch transposed into an interface — every decision
arm there was already a one-line delegate to an `apply*` method. That is the
decision that made the whole thing safe: not one `apply*` body moved, so the
load-bearing statement orderings inside them are untouched. Among them:

- `applyAttackerDeclarations`' `attacker-declared` → `attacked-alone` →
  `attackers-declared` emit order;
- `applyChooseFromZone`'s reveal-before-move and shuffle-before-`library-top`;
- the `deferredCommanderMove` latch's clear order;
- and the difference nobody had noticed: `applyScry` ends with a **guarded**
  `if (awaiting === null) prepareForPriority(...)` while `applyChooseFromZone`
  ends with a **bare** one. Any design that auto-resumed after an apply would
  have silently changed one of them.

`Game` remains the only writer of `GameState`.

## What it bought

`DECISIONS` is a total `Record`, so adding a kind now fails the build **at the
table**, naming the module you didn't write and the two entries you didn't
add. The five chains after:

| chain | before | after |
|---|---|---|
| `legalActions` awaiting block | ~200 lines, 17 branches | 2 lines |
| `answerAwaited` | ~170 lines, 17 branches | 2 lines |
| `decisionCandidates` | ~100 lines | 3 lines |
| `dispatch` | 25 arms | 7 priority arms |
| `canDispatch` | 25 arms | 7 priority arms |

`game.ts`: 10,787 → 10,126 lines.

## Adding a decision kind

1. Write `decisions/<kind>.ts` with `defineDecision({ … })`.
2. Register it in `decisions/registry.ts`.
3. Add its action to `DECISION_ACTIONS` and its offer to `DECISION_OFFERS` in
   `decisions/contract.ts`.
4. Add a fixture to `test/decisions/registry.test.ts`.

The raise is still hand-placed — a decision kind has to be raised from
wherever the rules produce it, and some raises are inlined
(`pay-life-for-untapped` has no `begin*` at all; its raise lives in
`moveObject` behind an `awaiting === null` drop-guard). The compiler names
every step above that you skip; it cannot name the raise.

## Things deliberately left alone

Recorded because each looks like an oversight and is not:

- **`sacrifice` checks duplicates then count; `discard` checks count then
  duplicates.** Both orders are reachable and both messages are asserted.
  Harmonising them would be a behaviour change wearing a tidy-up's clothes.
- **`choose-copy` appends the "copy nothing" candidate and *then* caps**, so on
  a board wider than 32 creatures it is the one that falls off. Every recorded
  `bot:bench` number was measured against that.
- **Six kinds have no `candidates`**, each carrying its reason. The sharpest is
  `commander-replacement`: searching it made the bot feed its commander to the
  first removal spell, because `features.ts` has no command-zone term while a
  graveyard card is worth 0.05.
- **`RandomController` and `HeuristicBotController` were not re-pointed at
  `blockingViolations`.** They build a `Map<blocker, attacker>` as a policy,
  not as a re-derivation of the predicate; rewriting them would move every
  fuzzer seed and every `bot:bench` number.

## Two hazards worth knowing

**Import direction.** Nothing under `decisions/` may import `game.js`, and
`state.ts` may not import from `decisions/` — `choose-creature-type.ts` imports
`printedCardName` as a *value*, so the reverse would close a real ESM cycle
whose symptom is `TypeError` at module init rather than a build failure. That
is why `defineDecision` lives in its own `decisions/define.ts` (the registry
imports every module, so a module importing the registry back is the same
trap), and why `decisionHasSource` **moved** out of `state.ts` rather than
being re-exported from it.

**`Immutable<GameState>` does not compile.** The design called for a
deep-readonly `DecisionReadCtx.state`. Reading `state.objects`,
`state.players`, `state.awaiting` or `state.delayedTriggers` through one fails
TS7056 — "the inferred type of this node exceeds the maximum length the
compiler will serialize". It is not depth but unions: a deep-readonly
`GameObject` alone fails the same way on `modifiers`. `state` is shallow
`Readonly` instead, with deep mutation left to convention plus
`MTG_CACHE_CHECK=1` on the fuzzer.

## How it was verified

Each of the 19 steps shipped as its own commit, green on typecheck, the full
engine + server suites, and `bot:scenarios`. Behaviour equivalence was checked
rather than assumed: every step ran 80 seeded `play:random` games at two and
four players against the previous commit and compared winner, turn count and
event count. **All identical, every step.** `MTG_CACHE_CHECK=1` ran alongside,
because `legal()` executes inside `legalActions`' `withComputedCache` region
and a module that mutated would poison it silently.

One methodological note: the first attempt at a comparison checked out only
`engine/src` from the older commit, which left new module files against an old
`contract.ts`, failed to compile, and produced an empty "before" — reported as
a divergence that wasn't one. Comparisons after that use a full-tree checkout.

## Not done

- **Step 18**, the client PR, on branch `client-attack-fix`: fixes a live bug
  (attack-with-all picked from the union of defenders, which a goaded creature
  makes illegal — pinned by a test in `goad-encore.test.ts`) and replaces three
  re-derivations with the engine's own functions. Needs a browser check in both
  a 2-player and a 3–4 player room at ~768px before it is pushed.
- **Step 19**, migrating `RandomController.toAction`'s 17 arms. The riskiest
  cheap thing in the plan: the fuzzer's replay identity depends on the exact
  sequence of `random()`/`pickIndex()` calls, so a reordered call inside a
  moved arm changes every seed's trajectory without failing anything. Attempt
  one kind per commit and revert any that produces a seed diff.
- **Four `decisionSource` bugs** the survey surfaced, all pre-existing and all
  out of scope here: landcycling's `choose-from-zone` and the cast-time
  additional-cost `discard` both attribute themselves to whatever resolved
  last, and `choose-text` names the target creature rather than the spell.

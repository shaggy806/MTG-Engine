# The decision registry

Status: **shipped**, all 19 steps.

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
| `RandomController.toAction` | 24 arms | 6 priority arms |

`game.ts`: 10,787 → 10,126 lines. `controller.ts`: 1,451 → 1,316.

## Adding a decision kind

1. Write `decisions/<kind>.ts` with `defineDecision({ … })`, including a
   `randomAnswer` — optional on the contract, but the fuzzer stalls on a kind
   that has none, so `registry.test.ts` requires one.
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

## Step 18: the client

Fixes a live bug and drops one re-derivation. **"Attack with all"** sent every
creature at `attackAction.defenders[0]`, the union across attackers, so a
goaded creature was sent at its goader and the server refused the whole
declaration (`⚠ Grizzly Bears is goaded and must attack someone else if able`);
it now uses each creature's own `defendersFor` and skips one with nowhere
legal to go. The **block Confirm button** re-derived menace and Lure by hand;
it now calls the engine's `blockingViolations` against the same offer, so the
button and the validator cannot disagree.

Checked in a browser at 1366x768: with the old code, three goaded creatures in
a 3-player room reproduce the rejection; with the fix they go to the
non-goader and the attack lands. A 2-player room, where the goader is the only
defender, still attacks it. Menace on the block bar: one blocker on a menace
attacker shows the warning and disables Block, a second enables it. Lure was
not exercised in the browser (no Lure card to hand); it is the same function.
It has been since (2026-09-23), in the `LURES` dev room. With nothing assigned,
the bar names all three creatures that must block and holds Block. With one of
them on the other attacker, it still holds. With all three on the Lure creature,
Block is enabled and the server accepts the declaration. The tapped creature is
exempt throughout.

An earlier version of this step lived on a `client-attack-fix` branch that was
never pushed, so it was redone from the description here rather than
recovered. The plan described it as replacing three re-derivations; only these
two turned up in `App.tsx`, so if the branch surfaces it may hold a third.

## Step 19: RandomController

The last chain. All 18 decision offers (17 kinds; `mulligan` answers two) left
`RandomController.toAction` for a `randomAnswer` on their own module, reached
through `randomAnswerFor`. What remains in the controller is the six priority
arms, which answer no `AwaitingDecision` and so have no module to live in:
`toAction` goes from 24 arms to 6, and `controller.ts` from 1451 lines to 1316.

Two things made it safe to do in one pass rather than the one-kind-per-commit
the plan called for:

- **`RandomSource`**, the contract's new seam: the controller's `random`,
  `pickIndex` and `pickTargets` handed over as an interface. `pickTargets` is
  on it deliberately — it rolls `random() < 0.25` to skip an optional slot
  *before* indexing, and a module rebuilding it out of `pickIndex` would
  almost certainly draw in the other order.
- **`OfferOf<K>`**, the offer-side `AwaitingOf<K>`, read off `DECISION_OFFERS`.
  It narrows `randomAnswer`'s parameter to the kind's own offer, so no module
  needed a runtime `if (legal.kind !== …)` guard and no arm grew a branch it
  did not have before.

The bodies then moved verbatim. Three of them have a call count that varies
with their input, and each is now commented where it sits, because they are
exactly what a tidy-up would break: `choose-copy` and `choose-creature-type`
short-circuit an `&&` and draw *no* number when the left side is false, and
`attackers` runs its `filter` to completion before its `flatMap` starts, so
every coin flip is drawn before any defender is picked.

`randomAnswer` is optional on the contract, since `candidates` genuinely is
absent on six kinds and the two share a shape. That makes a forgotten one fail
silently — `randomAnswerFor` returns null, the controller falls through to
`default`, and the fuzzer answers a pending decision with `pass-priority`,
which is rejected, so the game stalls rather than erroring anywhere useful.
`registry.test.ts` asserts every kind has one.

### How it was verified

The plan's warning was that a reordered call "changes every seed's trajectory
without failing anything", so the check had to be seed identity, not a passing
suite. Two harnesses, both first shown able to *fail*: with `0.6` changed to
`0.61` in one arm, the first reported 590 mismatches and the second 88 of 360
games differing.

- **Whole-game identity.** 360 fuzzer games (120 seeds x 2, 3 and 4 players),
  fingerprinted by a hash of the **entire event log** rather than the
  winner/turns/events triple the earlier steps compared — three moved arms
  could agree on that triple by coincidence, not on the log. All 360
  byte-identical, and the per-kind decision counts identical with them.
- **Per-arm identity, including draw counts.** 2069 real `LegalAction`s
  harvested from those games, replayed through the old and new controller in
  the same order, each driving its own copy of one seeded stream: 82,760
  answers over 40 seeds, all identical. Sharing a stream across the sequence
  is what makes this stronger than comparing single answers — an arm drawing
  one number more or fewer desynchronises and every later answer diverges.

Full engine (1139) and server (141) suites pass, plus `play:random` at 2
players under `MTG_CACHE_CHECK=1` and at 4 players.

One coverage gap worth recording: `choose-copy` **never fired in 360 games**.
Clone is in deck B, but the decision only raises when a Clone resolves with
another creature already on the battlefield. Its three offers in the replay set
are hand-built for that reason, and the fuzzer is not evidence about that arm.

## The `decisionSource` bugs (fixed after the fact)

The survey's "four `decisionSource` bugs" turned out to be **three**; the list
named three and counted four, and no fourth site exists. All three are fixed.

The root cause is one gap. `state.decisionSource` is set only by
`withDecisionSource`, which wraps *resolving* a spell or ability, and three
kinds — `choose-from-zone`, `discard` and `sacrifice` — carry no `source`
field on their `AwaitingDecision` to fall back on. So a decision raised while
an **action** is being taken had no attribution at all. The observed symptom
was usually `null` rather than a stale name: `withDecisionSource`'s `finally`
and `prepareForPriority` both clear the field, so there is often nothing left
over to inherit.

- **Landcycling** (`cycleCard`) and **a spell whose additional cost is a
  discard** (`castSpell`) now raise inside `withDecisionSource`. In both the
  card has already left the hand when the prompt appears — graveyard, or the
  stack — which is why `DecisionSource` carries `cardName` rather than leaving
  the client to resolve the object.
- **`choose-text`** was a different mistake: it is the one kind carrying both
  a `source` and a `target`, and `beginTextChoice` took the spell as a
  parameter, ignored it, and set both to the creature. Artificial Evolution
  answered "why am I being asked about Grizzly Bears?" with "Grizzly Bears".
  Safe to fix because nothing read that field — `applyTextChoice` uses
  `awaiting.target`, and so does the client's prompt.

`sacrifice` shares the structural gap but has no reachable bad path: an edict
always resolves, so the ambient source is right. Giving those three kinds a
`source` field of their own would close the class properly; it is insurance
rather than a fix, and it touches every raise site (`choose-from-zone` alone
has four).

Three tests in `decision-source.test.ts`, each confirmed to fail without the
change.

### A trap next to it

`game.ts` contains a **literal NUL byte** — the `"\0none"` sentinel at the
`chosenCreatureType` fallback, written as a raw byte rather than the escape.
It makes **git and grep treat the engine's largest file as binary**, which is
why a plain `grep` over it silently reports "Binary file matches" and finds
nothing; use `grep -a`.

Do not "just fix" it. With `core.autocrlf=true` and no `.gitattributes`, the
NUL is the only reason git stores that file verbatim: making it text lets git
normalise CRLF to LF on checkin, which rewrites all ~10,100 lines in one
commit and takes `git blame` with it. Verified — the diff is 20,270 lines,
and `--ignore-cr-at-eol` shows the 32 that are real. Fixing it properly means
deciding the repo's line-ending policy first, not editing the byte. (Every
other `.ts` blob is stored LF; `game.ts` alone is CRLF, on every line.)

One thing the NUL does *not* do: git's diff and merge only sniff the first
8,000 bytes for binary content, and the NUL is thousands of lines in, so
they treat the file as text. Two branches that edit different parts of
`game.ts` merge cleanly (checked 2026-09-23). It's the whole-file check
behind line-ending conversion (`git ls-files --eol` reports `-text`) and
`grep` that see it.

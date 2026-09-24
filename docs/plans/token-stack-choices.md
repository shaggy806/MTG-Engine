# Choosing some of a token stack

**Status:** in progress (2026-09-22). Requested by the user: "when we need to
select multiple creatures out of a token stack, can we get a menu to do so?
Similar to how we activate abilities". **Sacrifice is built**, engine and
client, and checked live in the browser, and so are **tap costs** and
**convoke**; combat is not. The counting and whole-stack fixes it builds on are done (see below).

## Background

A compacted token stack is one `GameObject` standing for `stackCount`
identical tokens (CLAUDE.md, "Token stacking"). Engine code that treats the
stack as **all** its tokens, or singles **one** out, is now right:

- **Counting** permanents weights a stack by its size (`permanentCount`).
- **"Each"/"all" effects** move or change a stack as a whole: destroy-all,
  return-to-hand-all, add-/double-counters-all, "each creature deals damage".
- **Watchers** trigger once per token when a stack dies or leaves.
- **Anything targeting one permanent** peels one member off first
  (`splitOneFromStack`), **once, as the target is chosen** (`lockInTargets`,
  when a spell is cast, an ability activated or a trigger put on the stack,
  after any cost has tapped or sacrificed members). It used to happen per
  effect step at resolution, so a multi-step effect reached a different
  token with each step: Tamiyo's Safekeeping gave hexproof to one token and
  indestructible to another, and Act of Treason stole one, untapped a second
  and hasted a third. Now the target names a single real object from the
  start, so a copy of the spell targets the same token, an opponent can
  answer by targeting it, and the spell fizzles if it's gone. At cleanup it
  folds back into its stack once nothing tells it apart (`tokenFoldKey`),
  unless a delayed trigger or prevention shield still names it
  (`pinnedTokenIds`).
- **Tokens granted an activated ability** (Cryptolith Rite) are woken into
  separate objects, since each has to pay its own `{T}`.

What's left is a **player choosing some members of a stack**. Every decision
that picks permanents offers a stack as a single entry, and answering with it
means either the whole stack or one member, never "three of these nine".

## Where it bites

Found by the review of the counting fix (a sweep by code and by card):

| Site | What happens now |
|---|---|
| ~~Sacrifice N (`promptNextSacrifice` → `sacrifice` decision): Necrotic Hex, Fleshbag Marauder with N > 1~~ | **Built.** The offer used to list the stack once while `count` demanded more picks than there were entries, so no answer was accepted and the game stalled. |
| ~~"Choose up to N, sacrifice the rest" (`sacrificeAllBut`): Archfiend of Depravity~~ | **Built**, as the same decision. |
| Declare attackers / blockers (`materializeStack`) | A stack always attacks or blocks as a whole (up to `MAX_MATERIALIZED`). It can't hold some back or split them across attackers. |
| ~~Convoke (`convokeCandidates`)~~ | **Built.** A stack was one candidate, so it could pay for one pip. Hour of Reckoning convoked by a player with 14 Soldier tokens got one. |
| ~~"Tap N untapped creatures" costs (`tapOthersCandidates`): Gravespawn Sovereign, Selesnya Evangel, Sephara's alternative cost~~ | **Built.** They were counted and tapped as objects, and picked for the player (`.slice(0, count)`), which was also an AUTHORING §0 problem. |
| Proliferate (`proliferateTargets`) | A stack is one entry and gets the counter on every member. Harmless for the player, since you'd normally want all of them, but not a choice. |

## Proposal

**Engine: an answer may name a stack id more than once.** Up to its size, in
any decision that picks permanents: sacrifice, convoke, tap costs, blockers
and attackers. The engine peels off one member per occurrence
(`splitOneFromStack`) before applying the answer. The wire shape stays
`ObjectId[]`, so the protocol, the bots' candidate generators and the
validators change little. Each offer's eligible entry carries the stack's size
the way `declare-blockers` now carries `copies`, and the validators allow a
repeated id up to it. Their current "chosen twice" checks become "chosen more
times than it has members".

**Client: a count menu on a stack tile.** During any of those selections,
clicking a stack opens a small menu beside the tile, placed the way
`AbilityMenu` is (portalled, anchored to the tile's `data-obj-id`, flipping at
screen edges), with a stepper or a row of counts from 0 to N. Confirm then
sends the id that many times. Menace, Lure and "sacrifice exactly N" already
check against the offer (`combat/blocking.ts`), so the Confirm button stays in
step with the validator for free.

**Order.** Sacrifice first, since it's the only one that can stall a game.
Then convoke and tap costs (both money-on-the-table). Then attack and block
splitting, which is the most UI.

## What sacrifice actually shipped

Close to the proposal, with one simplification worth recording. The offer
carries `copies` as a *map* (`Record<ObjectId, number>`) beside the existing
`eligible: ObjectId[]`, rather than turning `eligible` into a list of
records: the map is absent entirely on a board with no stack, so every
existing reader, validator and bot path is untouched, where reshaping
`eligible` would have churned all of them for a case that almost never
arises.

The client reuses `AbilityMenu` outright rather than growing a second
portalled, JS-placed, edge-flipping menu — the user asked for something
"similar to how we activate abilities", and the honest way to be similar to
it is to *be* it. The menu lists `None` and `Sacrifice 1..n`, where `n` is
the stack's size capped by what is still owed, so it can never offer an
answer the validator would refuse. The tile badges `☠ 2/9` while chosen,
because "selected" alone cannot tell three of nine from nine of nine.

Three answerers needed the same fix as the validator, and are easy to miss:
the bot's candidate enumeration, the fuzzer's random answer, and the
controllers' own `chooseSacrifices`, whose `eligible.slice(0, count)`
returned an answer too short to be legal.

## What tap costs shipped

The same shape as sacrifice. The offer is `tapCost: { count, choices, copies? }`
on the `activate-ability` offer, and on Sephara's `altCost` `cast-spell`
variant. The answer is `tap: ObjectId[]` on the action, naming a stack once per
token. The engine peels one token off per occurrence as it pays.

Two things came up that the proposal didn't anticipate:

- **One creature was paying both halves of a cost.** Selesnya Evangel's
  "{1}, {T}, Tap an untapped creature you control" with Llanowar Elves as
  the only other creature had the auto-payer tap the Elves for the {1}, then
  tapped them again for the cost. Now the mana is planned with every tap
  candidate tried last, and whatever the plan still has to tap is left out of
  `choices`. So any `count` of the choices leaves the mana payable, and the
  player can pick freely. At payment the picks are withheld from the mana
  plan outright (`ManaSourceArrangement` in `game.ts`).
- **The client never sent `altCost` or `costOption`.** Sephara's
  alternative-cost variant went out as an ordinary cast, and Bitter Triumph's
  two cost branches were both refused for naming none. Both are now echoed,
  with the variant named on its button.

The client asks after targets, since rule 601.2h pays costs last. It reuses the
sacrifice decision's count menu, "Tap 1..n", for a stack. A tile standing for
several identical permanents gives up its members one click at a time. A cost
with exactly as many candidates as it needs asks nothing.

A driver that doesn't pick (the bots, scripts) gets the summoning-sick
candidates first, since they couldn't attack this turn anyway. The fuzzer
picks at random.

## What convoke shipped

The same shape again, with `copies` on the `convoke` offer and a stack's id
named once per token in `Action.convoke`. Three things differ from tap costs:

- **The engine works out what each creature pays.** `ConvokePayment.pays` is
  optional. When it's omitted, a creature pays one of the cost's coloured pips
  it can pay, and otherwise a generic one. A client picking creatures
  shouldn't have to redo the colour arithmetic.
- **The same one-creature-twice bug existed here.** A convoking Llanowar
  Elves could also be tapped for mana by the auto-payer. Convoking creatures
  are now withheld from the mana plan. Creatures that make mana go last in
  `candidates`, so the offer's `proof` leaves them for the mana when it can.
- **The client never sent convoke at all**, so a spell only convoke could pay
  for was refused. A convoke step now follows the targets, capped at
  `maxCreatures` (every pip in the cost). When mana alone can't pay
  (`manaAffordable: false`) it starts from the engine's `proof`. Otherwise it
  starts empty, and confirming with none pays with mana.

## Not in scope

Stacks larger than `MAX_MATERIALIZED` stay partly compacted in combat, which
is the existing resource-safety cap. A stack past that size that's granted an
activated ability isn't woken at all.

# Choosing some of a token stack

**Status:** in progress (2026-09-22). Requested by the user: "when we need to
select multiple creatures out of a token stack, can we get a menu to do so?
Similar to how we activate abilities". **Sacrifice is built**, engine and
client, and checked live in the browser; convoke, tap costs and combat are
not. The counting and whole-stack fixes it builds on are done (see below).

## Background

A compacted token stack is one `GameObject` standing for `stackCount`
identical tokens (CLAUDE.md, "Token stacking"). Engine code that treats the
stack as **all** its tokens, or singles **one** out, is now right:

- **Counting** permanents weights a stack by its size (`permanentCount`).
- **"Each"/"all" effects** move or change a stack as a whole: destroy-all,
  return-to-hand-all, add-/double-counters-all, "each creature deals damage".
- **Watchers** trigger once per token when a stack dies or leaves.
- **Anything targeting one permanent** peels one member off first
  (`splitOneFromStack`).
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
| Convoke (`convokeCandidates`) | A stack is one candidate, so it can pay for one pip. Hour of Reckoning convoked by a player with 14 Soldier tokens gets one. |
| "Tap N untapped creatures" alternative costs (`tapOthersCandidates`) | Counted and tapped as objects, and picked for the player (`.slice(0, count)`), which is also an AUTHORING §0 problem. |
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

## Not in scope

Stacks larger than `MAX_MATERIALIZED` stay partly compacted in combat, which
is the existing resource-safety cap. A stack past that size that's granted an
activated ability isn't woken at all.

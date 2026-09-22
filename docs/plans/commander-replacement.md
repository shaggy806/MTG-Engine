# Commander replacement (rule 903.9a)

**Status:** the choice is never skipped any more (2026-09-22). Seven older bugs
found alongside the fix are still open and listed at the end; none of them
loses the choice itself.

## How it's shaped

The engine models 903.9a as a replacement effect (the pre-2020 wording) for all
four hidden zones: `moveObject` doesn't move a commander that's leaving the
battlefield for a graveyard, exile, hand or library. It parks the move in
`deferredCommanderMove`, raises a `commander-replacement` decision on
`awaiting`, and returns. `applyCommanderChoice` makes the move once the owner
answers. That keeps a "dies" trigger from ever seeing a commander that went to
the command zone.

Everything calling `moveObject` finds out the move didn't happen by reading
`awaiting !== null` afterwards. About a dozen sites rely on that.

## What went wrong

Found from a live game: Hour of Reckoning killed a player's Krenko, and they
were never offered the command zone. Hour of Reckoning wasn't the cause.

The old raise only fired when `awaiting === null && deferredCommanderMove ===
null`. Otherwise the commander moved with nobody asked. Two ways in:

1. **The question was overwritten.** Path to Exile and Assassin's Trophy defer
   the commander's move, then carry straight on into "its controller may
   search", which assigns its own decision to `awaiting` on top of the
   question. The commander never left, and `deferredCommanderMove` stayed set
   **for the rest of the game**, so every commander after that moved unasked.
   In the reported game this was almost certainly the bot's Path to Exile,
   which is in the Emmara deck, turns earlier. Hour of Reckoning was just the
   first thing to hit the stuck state.
2. **A mass effect that doesn't pause.** An overloaded Cyclonic Rift asked
   about the first commander, then bounced the rest while that question was
   still open.

Neither shows up with one spell against a clean board. A sweep of every
castable card against four commanders found only the Rift. The Path case needs
a *history*. It was found by playing ~430 whole bot-vs-bot games with the
starter decks and flagging any commander that left the battlefield for a
hidden zone without a `commander-zone-decision` event after it. There were 8
flags before the fix and 0 after, on the same seeds.

## The fix

- **Nothing is skipped; it waits.** A commander whose choice can't be asked
  right now goes on `pendingCommanderMoves` and stays on the battlefield, as
  the deferred one always has. A second attempt to move a commander that's
  already waiting is ignored: it goes where its first move sent it.
- **An overwritten question is asked again.** `raiseNextCommanderChoice`
  puts the deferred question back on `awaiting` once nothing else is there,
  then pops the queue. It runs at the top of every `prepareForPriority` pass,
  *before* the SBAs, so a waiting commander is asked about rather than swept
  up again. It also runs from `moveObject` itself, so the "`awaiting` is set
  whenever the move didn't happen" contract still holds for every caller.
- **Stale entries are dropped.** An entry whose commander is no longer on the
  battlefield is discarded when reached, so nothing can wedge the state again.
- `applyCommanderChoice` marks its own move with the transient
  `Game.completingCommanderMove`. Before, it let the move through by relying on
  `deferredCommanderMove` still being set; that no longer works, because a
  waiting commander has that field set too.

Tests: `engine/src/test/commander-replacement-queue.test.ts`. Four of its five
cases fail on the old code.

Changing to the post-2020 rule (903.9a as a state-based action for graveyard
and exile, so "dies" triggers do fire for a commander) was considered and left
alone. It's a rules change with its own consequences, not a bug fix.

## Still open (older than the fix, verified on the old code)

A review of the fix turned these up. Each reproduces identically on the code
before it.

- **Death counted twice.** `creaturesDiedThisTurn` is incremented at the top of
  `moveObjectUncached`, before the 903.9a branch and the Rest in Peace and
  flashback/disturb redirects. A commander is counted when deferred and again
  when completed: Murder on a commander, declined, counts 2, so Liliana's
  Standard Bearer draws 2. Chosen for the command zone, it counts 1 where the
  engine's own model says 0. Murder under Rest in Peace counts an exile as a
  death (Tragic Slip's morbid). Fix: count only when a creature really reaches
  a graveyard, after every redirect.
- **O-Ring loses its link.** Banishing Light or Conclave Tribunal on a
  commander whose owner declines the command zone: `exileByEffect` only sets
  `exiledBy` if the card is already in exile, and it isn't yet, so when the
  O-Ring leaves, the commander stays exiled forever. Carry the link across the
  deferral the way `pendingFlickerReturn` carries a blink.
- **A sacrificed commander isn't "sacrificed".** On the edict path
  (`drainPendingSacrificeVictims`) and in `sacrificeTarget`, a commander's
  deferral returns before `permanent-sacrificed` is emitted, and
  `applyCommanderChoice` never emits it, so Korvold misses it either way the
  owner answers (rule 701.21a). The cost paths emit it at once, so the two
  disagree.
- **Fetch into a shock land is free.** `applyChooseFromZone` moves the chosen
  cards before it clears `awaiting`, so `moveObject`'s shock-land offer (which
  requires `awaiting === null`) is skipped, *and* so is its enter-tapped
  default. Polluted Delta for Watery Grave: untapped, no 2 life. Hits every
  `fetchLand()`, Nature's Lore, Three Visits, Skyshroud Claim, Crop Rotation
  and others. Same class of bug as the one fixed here: a decision that can't
  be asked is dropped instead of queued.
- **Cleanup discard asks on the next turn.** `applyDiscard`'s cleanup branch
  calls `endStep()` without checking whether the post-discard SBAs raised
  anything, so a commander dying there (Giant Growth wearing off Rograkh with a
  -1/-1 counter) is asked about in the next player's untap step. That
  player then holds priority there, which rule 502.4 forbids. Nothing is lost.
- **Log events after a deferral.** Callers test `awaiting !== null` to mean
  "my move was deferred", which is also true when *another* decision is
  pending. So every permanent after the first commander in a Rift loses its
  `permanent-returned-to-hand`, and likewise `permanent-exiled` and
  `permanent-sacrificed` elsewhere. It only affects the history log: no trigger
  reads those events. The cure is for `moveObject` to report whether it moved.
- **"Sacrifice N" against a token stack can't be answered.** Unrelated to
  commanders, but found by the same fuzzing. Necrotic Hex makes each player
  sacrifice six creatures, and the offer lists a compacted token stack as one
  eligible object while still demanding six picks. Seven goblins in one stack
  plus Krenko: `eligible` has two ids, `count` is 6, and every answer is
  refused. In a live game that stalls whoever has to sacrifice.

# Commander replacement (rule 903.9a)

**Status:** the choice is never skipped any more (2026-09-22). The six older
bugs found alongside the fix are all fixed since (2026-09-23), and listed at
the end; none of them lost the choice itself. (A seventh, the double death
count, was fixed with the token-stack counting change.)

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

## Fixed since

A review of the fix turned these up, each reproducing identically on the code
before it. `commander-replacement-bugs.test.ts` covers the first four.

- **The O-Ring lost its link.** Banishing Light or Conclave Tribunal on a
  commander whose owner declined the command zone: `exileByEffect` only set
  `exiledBy` once the card was in exile, which it wasn't yet, so when the
  O-Ring left, the commander stayed exiled for good. The link now waits on the
  deferred move (`exiledBy` on `deferredCommanderMove` /
  `pendingCommanderMoves`, via `linkDeferredExile`), and `applyCommanderChoice`
  sets it if the card really goes to exile.
- **A sacrificed commander wasn't "sacrificed".** On the edict path
  (`drainPendingSacrificeVictims`) and in `sacrificeTarget`, a commander's
  deferral returned before `permanent-sacrificed` was emitted, so Korvold
  missed it either way the owner answered (rule 701.21a), while the cost paths
  emitted it at once. All paths now announce the sacrifice when it happens.
  "Dies" is read off `permanent-left-battlefield`, which only the move itself
  emits, so a commander that goes to the command zone still doesn't die.
- **The cleanup discard asked on the next turn.** `applyDiscard`'s cleanup
  branch called `endStep()` without checking whether the post-discard SBAs had
  raised anything, so a commander dying there (Giant Growth wearing off
  Rograkh with a -1/-1 counter) was asked about in the next player's untap
  step, where nobody may hold priority (rule 502.4). It now hands that
  decision's player priority in the cleanup step (514.3a), the way the normal
  path through `tick` already did.
- **Log events after a deferral.** Callers read `awaiting !== null` as "my move
  was deferred", which is also true when *another* decision is pending, so
  every permanent an overloaded Rift bounced after a commander lost its
  `permanent-returned-to-hand` (and likewise `permanent-exiled`,
  `permanent-destroyed`, `saga-completed` elsewhere). `moveObject` now returns
  whether it moved, and every caller that asked the question reads that. It
  also stops `flickerByEffect` parking an ordinary permanent as if its exile had
  been deferred when someone else's decision happened to be pending.
- **Fetch into a shock land was free.** `applyChooseFromZone` moved the chosen
  cards before it cleared `awaiting`, so `moveObject`'s shock-land offer (which
  required `awaiting === null`) was skipped, *and* so was its enter-tapped
  default: Polluted Delta for Watery Grave came in untapped for no life. The
  land now always enters tapped, and an offer that can't be asked yet waits in
  `pendingPayLifeForUntapped` until `prepareForPriority` raises it
  (`raiseNextPayLifeOffer`), one land at a time, so Skyshroud Claim finding two
  shock lands asks about each. Tests in `dual-lands.test.ts`.
- **"Sacrifice N" against a token stack couldn't be answered** (fixed by
  "Engine: sacrifice several tokens out of one stack"). Unrelated to
  commanders, but found by the same fuzzing: Necrotic Hex listed a compacted
  stack as one eligible object while demanding six picks, so every answer was
  refused. An answer may now name a stack once per token it stands for.
  Tests in `sacrifice-from-stack.test.ts`.

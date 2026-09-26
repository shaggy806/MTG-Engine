# Commander replacement (rule 903.9)

**Status:** the current rule since 2026-09-25 — see "The current rule" below.
Before that the engine modeled the pre-2020 replacement for every zone; the
rest of this record is about that model, whose fixes carried over. The choice
is never skipped any more (2026-09-22). The six older bugs found alongside the
fix are all fixed since (2026-09-23), and listed at the end; none of them lost
the choice itself. (A seventh, the double death count, was fixed with the
token-stack counting change.)

## The current rule (2026-09-25)

Rule 903.9a now reads: "If a commander is in a graveyard or in exile and that
object was put into that zone since the last time state-based actions were
checked, its owner may put it into the command zone. This is a state-based
action." 903.9b keeps the replacement for a hand or a library.

- `moveObject` lets a commander go to a graveyard or exile like anything else,
  and records it in `commanderArrivals` with the zone-change count it arrived
  with. Each state-based check (`offerArrivedCommanders`) queues an offer for
  every one still there, in APNAP order of their owners (rule 101.4), and
  `raiseNextCommanderChoice` asks them in turn once the check is done.
  `applyCommanderChoice` moves an accepted one to the command zone and leaves a
  declined one where it is; it isn't asked again until it next arrives.
- A move to a hand or a library is deferred exactly as before (903.9b), with
  everything below that kept it from being lost.
- So a commander dies: its own "when this dies" trigger fires (Child of Alara
  destroys every nonland permanent even as it goes home — the card sweep 2 bug
  that prompted this), Blood Artist drains for it, it counts for "a creature
  died this turn", and Omnath, Locus of Rage deals its damage as it last
  existed. The old model's "a commander sent home never died" was right only
  under the pre-2020 wording.
- A commander discarded, milled or countered is offered too: it was put into a
  graveyard, from wherever. The old model only ever asked about a permanent.
- A flickered commander is never asked: it's back before the next check. That
  made the deferred-blink machinery (`pendingFlickerReturns`) and the O-Ring
  link carried on a deferred exile (`linkDeferredExile`) dead, and both are
  gone: an exiled commander carries its `exiledBy` like any other card.
- The default answer (`AutomaticController`, under every bot) is still the
  command zone, but not for a commander in exile that can be cast from there
  — on an adventure, foretold or suspended — which its owner put there on
  purpose, and which costs no tax to cast from there.

The model below is what the engine did before this; the fixes to it still hold
for 903.9b.

## How it was shaped

The engine modeled 903.9a as a replacement effect (the pre-2020 wording) for all
four hidden zones: `moveObject` didn't move a commander that was leaving the
battlefield for a graveyard, exile, hand or library. It parked the move in
`deferredCommanderMove`, raised a `commander-replacement` decision on
`awaiting`, and returned. `applyCommanderChoice` made the move once the owner
answered. That kept a "dies" trigger from ever seeing a commander that went to
the command zone.

Everything calling `moveObject` found out the move didn't happen by reading
`awaiting !== null` afterwards. About a dozen sites relied on that.

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
alone at the time as a rules change rather than a bug fix. Card sweep 2 then
found a commander it made unplayable (Child of Alara), and it was made on
2026-09-25 — see "The current rule" above.

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

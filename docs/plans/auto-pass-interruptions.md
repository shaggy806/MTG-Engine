# Auto-pass interruptions

Status: **built** (2026-09-22), server-side only — in the tree, not yet
committed. Follows on from `resolve-all-stack.md`.

## The ask

> "I want autopass to temporarily disable if the opponent casts a spell or
> attacks you, so that you can respond."

Auto-pass ("pass the rest of this turn" / "pass until my own turn again") had
exactly two endings: the turn boundary it was armed for, and a decision the
engine raised for that seat. Everything else it passed. So an opponent could
cast a removal spell at your creature, or swing at your face, and the window
you would have answered it in went by without ever reaching the screen.

## The rule, and why it isn't a new one

"Stop on anything real" — the rule `resolve-all` already implements. Not a
new list, the *same* list: `Room.resolveAllStop`'s body moved into
`Room.interruptSince(seat, state, from)`, and both features call it. Each
keeps only its own ending on top — resolve-all's is the stack emptying,
auto-pass's is `clearAutoPassIfDone`'s turn boundary. One scan, so the two
cannot drift apart, and `resolve-all`'s own tests were left untouched to prove
it didn't move.

The scan stops on, since the fast-forward was armed:

- an **opponent** casting a spell or activating an ability (a *trigger* isn't
  this — that's `ability-triggered`, and only a deliberate action reaches the
  check);
- something this seat **owns** becoming the target of anything it didn't cast;
- a permanent this seat **owns** leaving the battlefield;
- a player losing;
- **new:** an attacker declared against this seat, or against a planeswalker
  it controls.

The attack condition is the one the ask actually needed, and it is *mostly*
redundant: being attacked normally raises a `declare-blockers` decision for
the defender, and a raised decision already stops auto-pass. It earns its
place on the defender who has **no eligible blocker** — `promptNextBlockerDeclaration`
skips them and never asks — which is precisely the seat with the most reason
to want a window before damage, and the only one for whom the attack was
previously invisible to auto-pass.

Widening the shared scan means resolve-all gains the attack condition too.
That is a no-op in practice: attackers are declared with an empty stack, and
resolve-all disarms at the first window where the stack is empty, so it is
never armed when an `attacker-declared` event can land.

## Where it is armed from

`Seat.autoPassFrom` records the event-log length when `autoPassUntil` is set,
the same trick `resolveAllFrom` uses — a fast-forward needs a point to scan
*from*, or it would trip over the whole game's history the first time it ran.
It is set by both `requestPassTurn` and `requestAutoPass`, and cleared
wherever `autoPassUntil` is: cancelling, the turn boundary, and the new
interruption.

## Disarmed, not suspended

When the scan fires, `autoPassUntil` goes to `null` and the player re-arms it
themselves — the same one-shot-recovery shape resolve-all has. Suspending it
for a single window would hand the player one frame of control and then take
it straight back, which is worse than not stopping at all: you would answer
the spell and immediately lose the turn again.

Nothing crosses the wire for this. `autoPassing: room.isAutoPassing(seat)`
already rides on every `state` frame, so the client's indicator un-highlights
on the next push with no protocol change and no client change at all.

## The part that is easy to get wrong

`autoAdvanceHumanSeat`'s condition is a chain of disjuncts, and the
interruption guards **only the last one**:

```ts
if (forcedPass || manaOnlyAndSkipping || resolvingStack ||
    (wasActive && !justCleared && !interrupted)) { …pass… }
```

A window whose only legal action is passing — or, for a seat that opted into
`skipManaOnly`, one where tapping for mana is all that's left — has nothing to
respond *with*. Stopping the player there buys them no decision, so guarding
the whole condition would have turned every opponent spell into a dead click
on an empty window, several times over as priority went round. The scan still
fires and still disarms auto-pass in those windows; it just doesn't hold up a
window that was going to pass itself anyway.

That asymmetry is what the tests are mostly about. `server/src/test/room.test.ts`
covers: an opponent's spell disarming auto-pass with the spell still on the
stack; a forced-pass window and a mana-only window passing *through* the same
interruption; an ordinary opponent's turn still being carried all the way
(the control — it passes with the feature switched off, which is its job); and
an attack against a seat with no possible blocker stopping it in the very
window the attack opened, before combat damage.

Each was checked by mutation, because the room's fast-forward machinery makes
a vacuous test very easy to write (see `resolve-all-stack.md`'s "A trap worth
recording"). Deleting the feature fails three of the five; moving the
`!interrupted` guard out to cover every disjunct fails the other two. The test
rooms give a seat a Forest on the battlefield for the same reason: without one,
every window in an all-Forest deck is a forced pass and the game fast-forwards
itself whether or not any of this works.

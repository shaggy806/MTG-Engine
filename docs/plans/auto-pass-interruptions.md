# Auto-pass interruptions

Status: **built** (2026-09-22). Follows on from `resolve-all-stack.md`.
Revised the same day: an interruption now **pauses** auto-pass until the
stack is clear instead of switching it off (see "Paused until the stack is
clear" below). The client shows the pause on the button.

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

## Paused until the stack is clear

> "Autopass should still stay on after we temporarily disable it from an
> opponent casting a spell or something similar. Once the stack is clear
> again it should be re-enabled."

The first version disarmed auto-pass outright when the scan fired
(`autoPassUntil` to `null`), so the player had to re-arm it after every
opponent spell for the rest of the turn. The argument for that was against
the wrong alternative. Suspending it for a *single window* would hand back
one frame of control and then take it straight back, and you would answer the
spell and immediately lose the turn again. Pausing until the **stack is
clear** has neither problem: the seat keeps its windows for as long as the
interruption is still playing out, and gets its auto-pass back when it's over.

So the scan now sets `Seat.autoPassPausedAt` (the event-log length at the
moment) and leaves `autoPassUntil` armed. `resumeAutoPassIfClear` picks it
back up at the seat's first **priority window** after that with an empty
stack. Two details carry the whole design:

- **"After", not "at".** An attack pauses auto-pass with the stack already
  empty, so resuming in the window it paused in would pass the very window
  the attack earned. "After" is "any event since", which a pass always is.
  This only shows when the room re-evaluates the same window without the seat
  acting (another seat changing a setting, a reconnect, an ack); the attack
  test does exactly that.
- **Priority windows only, never a decision.** A decision owed while paused
  is usually the interruption's own consequence, like an edict's sacrifice,
  which is asked once the edict has left the stack. Resuming there restarted
  the scan before the answer, and the Bears the seat then sacrificed counted
  as "a permanent you own left the battlefield" and paused it all over again.
  Found live in the browser. The unit test for it only reproduced once the
  seat had *two* creatures: with one, the engine takes the sacrifice without
  asking, and the decision never comes up.

On resume the scan restarts from that point, so nothing that happened during
the pause can trip it again. Clicking the button while paused switches
auto-pass off, as it does while running.

The wire carries the pause as `autoPassPaused` beside `autoPassing`. The
client's button reads "Auto-pass paused" rather than "Stop auto-pass", since
a button claiming to be passing while the game waits on you looks broken.

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
fires and still pauses auto-pass in those windows; it just doesn't hold up a
window that was going to pass itself anyway.

That asymmetry is what the tests are mostly about. `server/src/test/room.test.ts`
covers: an opponent's spell pausing auto-pass with the spell still on the
stack, and auto-pass resuming by itself once it has resolved; an edict's
sacrifice not pausing it a second time; a forced-pass window and a mana-only
window passing *through* the same interruption; an ordinary opponent's turn
still being carried all the way (the control — it passes with the feature
switched off, which is its job); and an attack against a seat with no possible
blocker stopping it in the very window the attack opened, before combat
damage. That window has to survive the room re-settling it, and auto-pass then
resumes once the seat passes it.

Each was checked by mutation, because the room's fast-forward machinery makes
a vacuous test very easy to write (see `resolve-all-stack.md`'s "A trap worth
recording"). Deleting the feature fails three of the original five; moving the
`!interrupted` guard out to cover every disjunct fails the other two. For the
pause: disabling the resume fails both resume tests. Dropping the "after, not
at" check fails the attack test. The edict test failed against the version
that resumed inside decisions. The test
rooms give a seat a Forest on the battlefield for the same reason: without one,
every window in an all-Forest deck is a forced pass and the game fast-forwards
itself whether or not any of this works.

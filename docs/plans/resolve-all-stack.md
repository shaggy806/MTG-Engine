# Resolve all

Status: **shipped** (2026-09-22). Requested 2026-09-20 and parked while the
decision carve-up was in flight; built once that finished.

## The ask

A **"resolve all" button**: when the stack fills up with triggers nobody wants
to respond to, let a player clear the whole stack in one action instead of
passing priority once per object.

## Why it's worth doing

Passing priority between every stack object is correct by the rules and
miserable in play. A trigger-heavy board — Sagas ticking, a token generator
with an ETB rider, Monarch and landfall triggers stacking on one turn — can put
half a dozen objects on the stack, and the client asks for priority between
each. The engine is right; the interaction is the problem.

## What it is

A **one-shot**, not a fourth standing mode. It arms, the stack drains, and it
disarms itself; nothing is remembered for the next stack. That was the first
of the four open questions and it settles the rest: a mode would need a
stopping *condition* the way `auto-pass` does, where a one-shot only needs a
stopping *event*.

`ClientMessage` gains `resolve-all`. `Room.requestResolveAll` arms the seat by
recording the event-log length; **all the work happens in
`autoAdvanceHumanSeat`**, which was already the single place deciding whether
a human seat's window passes itself. A separate loop would have drained the
stack outside the frame gate and stopped bot moves being paced — question 4,
answered by not introducing a second path rather than by handling it.

Arming on an empty stack is a no-op, deliberately: there is nothing to
resolve, and arming would silently pass the seat's next real window.

## The stopping rule

"Stops on anything real", chosen over "stops only on my own decisions". The
cost of stopping early is one extra click; the cost of not stopping is
resolving past something you wanted to respond to.

Everything that counts is an event, so the check is a scan of the log since
arming (`Room.resolveAllStop`):

- this seat is asked for a decision (handled where `awaiting` is read);
- an **opponent** casts a spell or activates an ability — their own *triggers*
  going on the stack are not this, since a trigger is `ability-triggered` and
  only a deliberate action reaches the check;
- something this seat **owns** becomes the target of anything it didn't cast;
- a permanent this seat **owns** leaves the battlefield;
- a player loses;
- the stack empties, which is the successful ending.

`owner`, not `controller`, in the last two: `moveObject` has already reset
control to the owner by the time the event is read. The side effect is that a
permanent this seat had *stolen* leaving doesn't stop it, which is the right
answer anyway — the card was never theirs.

## Per-seat, not shared (question 3)

It passes **this seat's** priority only. Other seats still pass their own, so
against bots it drains immediately and on a table of humans it drains only as
fast as everyone else lets it. The alternative — a request other seats can
decline — is a negotiation for something that is meant to save a click.

## A trap worth recording

The first test for this **passed with the feature disabled**. With a non-empty
stack a player can't play a land or cast a sorcery, so on the all-Forest decks
of `makeSparseRoom` every window is already a *forced* pass and the stack
drains on its own. A test of "resolve-all drains the stack" therefore proves
nothing unless the seat has a real instant-speed option: `stackedRoom` gives
it a Forest and a Fog for exactly that reason, and the tests were re-checked
by disabling the branch and confirming they fail.

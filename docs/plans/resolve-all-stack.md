# Resolve all

Status: **requested, not started.** Captured 2026-09-20 so it isn't lost; no
design decisions made yet, and deliberately not begun while the decision
carve-up is in flight.

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

## What already exists, and should be reused

This is close enough to existing machinery that the first job is deciding
whether it's a new thing at all:

- **`auto-pass`** (protocol + `Room.settle()`) already means "keep passing my
  priority windows until something real happens", running clean through an
  opponent's turn and stopping when this seat is asked for a genuine decision.
- **`pass-turn`** is the same idea scoped to the current turn.
- **`toggle-mana-skip`** is a standing per-seat preference that skips windows
  where tapping for mana is the only option.
- **`isSettled` / `autoSettle`** (`engine/src/auto-settle.ts`) already cascade
  past every dead priority window. `Room` deliberately uses `isSettled` and
  never `autoSettle`, because it has to stop at each bot action to publish a
  frame — which is exactly the tension a "resolve all" has to resolve too.

So the real question is **not** "how do we resolve a stack" — the engine can
already do that — but **where this sits among the three auto-pass modes that
exist**, and what is allowed to interrupt it.

## Open questions

1. **A fourth per-seat mode, or a one-shot?** `auto-pass` and `pass-turn` are
   standing states with a stopping rule. "Resolve all" reads more like a
   one-shot: clear *this* stack, then give me priority back. Those want
   different protocol shapes.
2. **What stops it?** Certainly a decision this seat is asked for
   (`awaiting.player === me`). Probably also: a spell resolving that targets
   something of mine, a state-based action killing something of mine, or an
   opponent casting into the window. Too eager and it plays the game for you;
   too timid and it stops on every trigger, which is the status quo.
3. **Is it per-seat or shared?** Resolving "the whole stack" needs every other
   seat to pass too. Either this is a request the other seats can decline —
   which makes it much less useful — or it's a local convenience that stops the
   moment anyone else acts.
4. **How does it interact with the frame gate?** `Room` paces bot moves one
   frame at a time so clients can animate them. A stack resolving in one action
   would produce a burst of frames, and `usePlayback`'s "one thing at a time"
   rule would queue them all anyway. Possibly this needs a compressed
   animation path rather than the per-frame one.

## Scope

Touches all three workspaces: a protocol message, a `Room` stopping rule, and a
client control. No engine rules change — the engine already resolves the stack
correctly; this is about how many round-trips it takes to ask it to.

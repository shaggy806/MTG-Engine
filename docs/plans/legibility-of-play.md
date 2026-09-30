# Legibility of play: animation and pacing

Status: **planned** (2026-09-30). Nothing built yet. The item list is `BACKLOG.md`'s "Legibility of
play" section. This file orders that list and settles the two design questions everything else
depends on.

## The problem

A bot turn can't be followed by eye, even at the slow bot speed. The pipeline
(`docs/architecture/client.md`: `usePlayback` / `animationBus` / `AnimationLayer`) plays each
server frame's animations over the board *before* the frame, then swaps in the new board. Only
three slot kinds hold the game up (`PACED`: a card played, a combat hit, a permanent leaving).
Everything else, such as a tap, a counter, a token, a life change or a stack item resolving, just
appears with the next board. The slow bot speed's 1.6 s linger comes *after* that swap, so it
stretches the pause between moves without making anything inside a move easier to see.

So most of the fix is **more events with slots of their own**, plus a way to animate the *new*
board, which is the part the current pipeline can't do.

## Design decision 1: a frame gets a second half

Today a frame has one half: animations over the old board, then the swap. Half the list can't be
drawn that way, because it describes something that exists only on the new board: a tile tapping,
a counter landing, a token arriving, a permanent reaching its new controller.

**A frame becomes `before` → swap → `after`.** `scheduleEvents` returns two schedules
(`before.totalMs`, `after.totalMs`). `usePlayback` shows the new board when `before` finishes, then
holds `busy` and the server ack for `after.totalMs`. The ack still fires once per frame, so the
server's frame gate (`server/src/room.ts`, `holdForClients`) needs no change: bots wait for both
halves automatically.

- **Before** (old board): cast/play spotlight, combat hit, a permanent leaving, a library card
  leaving (mill, exile from the top), a discard, stack exit.
- **After** (new board): enter, tap/untap, counters, buff, damage/life flash, floating numbers,
  transform flip, attach, change of control, trigger-source pulse.

## Design decision 2: tile effects are CSS animations on mount, not overlays

`Table` remounts per frame shown. That's why a CSS *transition* on a tile never plays: there is no
previous style to transition from. A CSS `@keyframes` *animation* does play on mount, though, and
the after-half runs on exactly that mount. So the effect channel is:

- `usePlayback` hands `Table` a per-frame `effects: ReadonlyMap<ObjectId, TileEffect[]>` (plus
  `playerEffects` keyed by seat) built from the after-schedule, each entry with a
  `delay`. `MiniTile` / `PlayerPanel` put a class and `--fx-delay` on the element, and App.css
  owns the keyframes. There's no DOM lookup, no measuring, and nothing to clean up.
- Tapping is a keyframe from `rotate(0)` to the tapped pose. Untapping is the reverse.
- `AnimationLayer` keeps what only an overlay can draw: things *moving between places* (bounce to
  hand, dying to the graveyard, control change, attach, mill), arrows, and floating numbers. A
  move uses a **ghost flight**, one shared helper: measure the source rect on the old board
  before the swap, then the destination rect after it (by `data-obj-id`, `data-library-of`, and
  new `data-graveyard-of` / `data-hand-of` / `data-exile-of` anchors), and fly a `CardTile` ghost
  between them. The real destination tile is hidden until the ghost lands (a `fx-arriving` class
  on it in the effects map). `runHit` and the draw flight already do half of this, so the helper
  generalises them rather than adding a third copy.

## Design decision 3: one timing scale, set by the viewer

Every `*_STEP_MS` and every CSS duration reads from one multiplier:

- **`animScale`** is a per-client setting (0.5× / 1× / 1.5× / 2×, stored locally with try/catch),
  published as `--anim-scale` on `:root`. `scheduleEvents` multiplies by it, and CSS writes
  durations as `calc(<ms> * var(--anim-scale))`.
- **Reduce motion** (a setting, and `prefers-reduced-motion`) sets movement to zero: no flights,
  lunges or flips. It keeps colour cues (glows, flashes) and floating numbers as short fades, so
  the information stays and the motion goes.
- **The host's bot speed** stays a server-side linger and doesn't change the client's scale. The
  cast spotlight's length follows the viewer's scale, not the bot speed.
- **`MAX_FRAME_MS`** scales too, and becomes a per-half ceiling. Adding paced slots makes a big
  frame (a wrath, a token army) likelier to hit it. Past the ceiling, coalescing replaces
  dropping: all tokens entering in one frame share one beat, the way deaths already share one.

This comes first because every later item must honour both settings, and retrofitting them onto
twenty animations is the expensive order.

## Build order

Each step can ship on its own and is checked live (2-player, 4-player, ~768 px tall) before the
next.

**Step 0: groundwork.**
- The settings popover (animation speed, reduce motion, and a sound toggle that stays unwired for
  now), `--anim-scale`, `useMotionPrefs`.
- The before/after split in `scheduleEvents` + `usePlayback`, with unit tests for the scheduler:
  both halves, coalescing, and ceilings.
- The tile effect map, with tap/untap as its first user. It's the simplest effect and proves the
  mount-animation approach.
- The ghost-flight helper and zone anchors, with bounce to hand as its first user.

**Step 1: the stack and whose turn it is.** These were the loudest complaints.
- Stack label and target text sized from `--card-w`, not 11 px. Move the stack left so it stops
  covering the bottom-right life total.
- The controller's name on the cast spotlight and on stack entries.
- A stack exit animation, before-half. A resolving spell heads toward its destination, and a
  countered or fizzled spell gets its own exit (a crack, then down to the graveyard).
- The trigger source pulses on `ability-triggered`.
- **Resolve all, one item at a time.** Server: `autoAdvanceHumanSeat` publishes a frame and parks
  on the frame gate after each resolution while resolve-all is armed (see
  `docs/plans/resolve-all-stack.md`), with `spell-resolved` / `ability-resolved` getting slots.
  This is the one item that changes the server's pacing, so it gets a room test on the fake
  clock.
- The active player's quadrant is highlighted for the whole turn. A "thinking…" chip shows on the
  seat the game is waiting on, which the client can work out from the view (priority holder or
  pending decision) without a protocol change.

**Step 2: after-half tile effects.** Each is a few lines of CSS plus a map entry once Step 0
exists.
- Enter (tokens get a distinct materialise, using `VisibleObject.isToken`, which the view already
  carries, so no engine change is needed).
- Counters glow, a non-counter buff gets a different glow, and a transformed card flips.
- Life gain (green) and loss (red) flash on the player panel. Noncombat damage flashes on a
  creature.
- Floating numbers go with both.

**Step 3: moves (ghost flights).**
- Dying flies to the graveyard pile, and exile gets a distinct dissolve toward the exile anchor.
  This replaces `runDeath`'s single fade.
- Discard goes from hand to graveyard. Mill and exile from the top of a library flip off the pile.
- Change of control slides between boards. Aura/Equipment flies onto its host.
- The cast spotlight starts from the zone the spell was cast from.
- The monarch marker moves to its new holder.

**Step 4: arrows.**
- Source → target arrows on `object-targeted`, drawn on an SVG layer over the table from
  `data-obj-id` / player panel anchors. They're drawn in the after-half and stay up while the
  entry is on the stack, replacing nothing: `aim` stays for the hover case.
- Attack arrows and block lines use the same layer.

**Step 5: control and review.**
- **Pause / step bots (host).** A protocol message (`bot-pause`, `bot-step`) and a room flag. When
  paused, `tryOpenGate` doesn't open; a step opens it once. The pause is shown to every seat. The
  gate's ack timeout must not fire while paused.
- **Replay the last update.** `usePlayback` keeps the last frame and the view before it, and
  replaying re-runs both halves against them. The replay is read-only, and `busy` holds for it.
- **Clicking a history log entry highlights the cards it involved.** The event's object ids go
  into a transient highlight set in `GameScreen`.
- **Sound effects**, off by default: a few short cues (cast, hit, death, life), a small audio
  sprite, played from the same schedule as the visuals. Last because it needs sourcing
  licence-clean sounds, and nothing else depends on it.

## What this plan deliberately doesn't do

- **No intermediate boards from the server.** Sending a view per event would make the before/after
  split unnecessary, but it multiplies bandwidth and redaction work per seat and breaks the
  one-frame, one-ack gate. Two halves per frame buy most of the legibility for none of that.
- **No engine events added**, except for initiative, which has no event and so no animation. That
  stays a BACKLOG line until the engine emits one.
- **The linger isn't made longer.** Once more events have paced slots, "slow" may turn out to be
  too slow. Re-measure after Step 2 before touching `BOT_LINGER_MS`.

## Risks

- **Frame length.** More paced slots make a bot turn take longer to watch. The per-half ceiling,
  coalescing, and the viewer's speed setting are the valves. If Step 2 makes a 4-player bot game
  drag, the fix is shorter default durations, not fewer effects.
- **The ack timeout.** `FRAME_ACK_TIMEOUT_MS` is 6 s. A frame whose two halves add up past that
  gets cut short on the server's side, and the bot moves on under the animation. Either cap the
  client's two halves under it, or raise it with a comment tying the two numbers together.
- **Remount cost.** Keyframe classes on tiles are cheap. Arrows and ghosts must stay in
  `AnimationLayer`, never inside `Table`, or the per-frame remount restarts them.

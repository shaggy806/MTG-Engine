# Legibility of play: animation and pacing

Status: **in progress**. Planned 2026-09-30; Step 0 (the groundwork) and Step 1 (the stack and
whose turn it is) done the same day, Steps 2–5 not started. The item list is `BACKLOG.md`'s "Legibility of play" section. This file orders that
list and settles the design questions everything else depends on.

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

## Design decision 2: tile effects start on the freshly mounted board, before it paints

`Table` remounts per frame shown. That's why a CSS *transition* on a tile never plays: there is no
previous style to transition from. The effect has to start on the new board's elements, from the
old pose, before that board is ever painted in its new one.

*As planned*, that was a per-frame effects map handed down to `MiniTile`/`PlayerPanel` as classes
and CSS `@keyframes`, which play on mount. *As built* (Step 0), it's simpler and matches how
`runHit`/`runDeath` already work: `usePlayback` publishes the `after` cues from a **layout
effect**, which runs once the new board is in the DOM and before it's painted, and
`AnimationLayer` starts each one in that same task as a Web Animation on the tile it finds by
`data-obj-id`, with the wait passed as `delay` and `fill: 'backwards'` holding the old pose until
then. That needs no prop threading through `Table`'s many render paths, and nothing to clean up.
Measured live: on the first painted frame, a tile that just tapped already has its `tapped` class
but still has an identity transform, and one that just untapped is still at exactly the tapped
pose. A timer instead of the same-task start would paint the new pose first.

- Tapping runs from `transform: none` to the tapped pose, with the dimming scrim fading in on
  `::before`. Untapping runs from the tapped pose to upright.
- Things *moving between places* go through **`flyGhost`**, one shared helper: a copy of the tile
  in its own box on `<body>`, outside React, flown with `.animate()` and removed when it lands,
  while the real tile is hidden. Bounce to hand is its first user, and needs only the old board
  (the hand edge of the tile's cell). A move whose destination only exists on the new board
  (control change, attach) will measure the source before the swap and the destination after it.
  The new zone anchors (`data-graveyard-of` / `data-hand-of` / `data-exile-of`) come with the
  first item that needs them.

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
- **`MAX_FRAME_MS`** scales too. As built it's one ceiling for both halves together, since the
  server waits on the whole frame, capped at 11 s (`FRAME_CEILING_MS`) however slow the viewer;
  the server's `FRAME_ACK_TIMEOUT_MS` went from 6 s to 12 s to sit above it. The first paced slot
  that won't fit ends the frame (the old check let a frame run one slot past its ceiling: four
  casts took 7.2 s against a 6 s server timeout). Adding paced slots makes a big frame (a wrath, a
  token army) likelier to hit it, so each run of one kind shares one beat: deaths already did, and
  taps and untaps do now.
- **A hidden tab animates nothing** and acks each frame at once, rather than leaning on the
  server's timeout. Nobody is watching it, and its timers are throttled anyway.

This comes first because every later item must honour both settings, and retrofitting them onto
twenty animations is the expensive order.

## Build order

Each step can ship on its own and is checked live (2-player, 4-player, ~768 px tall) before the
next.

**Step 0: groundwork.** *Done 2026-09-30.*
- The settings panel (the "Animations" button: speed and reduce motion; no sound toggle until
  there are sounds), `--anim-scale`, `useMotionPrefs`. Every existing reduced-motion rule in
  App.css now keys on `:root[data-reduce-motion]`, set by the setting or the media query.
- The before/after split in `scheduleEvents` + `usePlayback`, with vitest unit tests for the
  scheduler (the client's first): both halves, shared beats, speed, reduced motion, ceilings.
- The tile effect channel (decision 2), with tap/untap as its first user.
- `flyGhost`, with bounce to hand as its first user.
- Found while checking it live, and fixed separately: a board whose tile-size search looped
  forever as a scrollbar came and went, so its tiles jumped between rows every frame. Not caused
  by this work (it reproduced on the code before it); fixed with `scrollbar-gutter: stable`.

**Step 1: the stack and whose turn it is.** *Done 2026-09-30.* These were the loudest
complaints. Notes from building it:
- The stack pile's arrival animation replayed on every entry every frame (`Stack` renders inside
  `Table`, which remounts per frame; the CSS comment claimed otherwise). Fixed by `usePlayback`
  reporting the previous board, so only an entry that wasn't on its stack plays `is-new`. Needed
  before per-object resolve-all frames, or the whole pile would have re-jumped on each one.
- Resolve-all's frames are counted in resolutions (`spell-resolved`, `ability-resolved`,
  `spell-countered`, `spell-fizzled` since the last published frame), not stack depth, since a
  resolution that adds a trigger leaves the depth unchanged.
- The stack moved in from the right edge by a rail's width (`--card-w-max` + 2.2vw + 8px).
  Measured clear of the rail and the life totals at 1424x715, 1904x895 (a 1080p window) and
  2544x1207 (1440p).
- A trigger's pulse plays over the new board, so a dies trigger's source (already gone) doesn't
  pulse; that's a BACKLOG line.
- The whole-turn highlight already existed as a 1px gold line; it's now the active player's seat
  colour, border and glow.

Items:
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

# Legibility of play: animation and pacing

Status: **shipped** (2026-09-30). All six steps were planned and built that day; the follow-ups
are under "Follow-ups" at the end of this file (`BACKLOG.md` points at them). This file orders
the original list and settles the design questions everything else depends on.

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

**Step 2: after-half tile effects.** *Done 2026-09-30.* As built: every effect plays in the after
half, which is now ordered by kind (`AFTER_ORDER`: untap, tap, enter, flip, counter, buff, hurt,
pulse) rather than log order, with each run of a kind on one shared beat, so a creature entering
with counters and a trigger reads as three beats. Combat damage to a creature claims two slots (the
strike before, the number after); damage to a player is shown only by its `life-changed`. Text
floats off through one helper, `floatText`. Also: the played-card spotlight now *rises* from one
spot for everyone by default (the user's pick, 2026-09-30, after the caster's name went on it —
flying in from their side read as wrong); the old flight and a plain fade stay as options in the
Animations panel for now. Each is a few lines of CSS plus a map entry once Step 0
exists.
- Enter (tokens get a distinct materialise, using `VisibleObject.isToken`, which the view already
  carries, so no engine change is needed).
- Counters glow, a non-counter buff gets a different glow, and a transformed card flips.
- Life gain (green) and loss (red) flash on the player panel. Noncombat damage flashes on a
  creature.
- Floating numbers go with both.

**Step 3: moves (ghost flights).** *Done 2026-09-30, reshaped by the user:* there is no
graveyard or exile drawn on the table, so nothing flies to one. Leaving the battlefield, a stack
exit that isn't a permanent, a mill and a discard are all shown in place — dying sinks grey,
exile dissolves white-blue, a library peels cards off its pile, a discard greys out of the hand
(another player's hand link flashes). Step 1's stack exits, which flew to the graveyard link,
changed to match. Movement stays for things that go somewhere on the table: a change of control,
an Aura or Equipment moving, the crown, a bounce (now to the *owner's* hand, via the old board
each cue now carries as `prev`). Those take a snapshot over the old board at the frame's start
and fly it onto the new spot. The live checks ran in Playwright's headless Chromium at 1920x1080
(the desktop tab was hidden, which by design animates nothing). Original items:
- Dying flies to the graveyard pile, and exile gets a distinct dissolve toward the exile anchor.
  This replaces `runDeath`'s single fade.
- Discard goes from hand to graveyard. Mill and exile from the top of a library flip off the pile.
- Change of control slides between boards. Aura/Equipment flies onto its host.
- The cast spotlight starts from the zone the spell was cast from.
- The monarch marker moves to its new holder.

**Step 4: arrows.** *Done 2026-09-30.* As built, arrows are drawn from the board's state, not
from events (`ui/ArrowLayer.tsx`, rendered inside `Table` and measured off each mounted board):
the aimed stack entry's targets (the top one, or the one hovered — the same rule as `aim`), each
attacker to what it attacks, each blocker to what it blocks. So an arrow stays up exactly as long
as what it shows is true, and only one that wasn't on the previous board draws itself in. A
player is pointed at by their life total, not their panel, whose middle points at nothing.
Original items:
- Source → target arrows on `object-targeted`, drawn on an SVG layer over the table from
  `data-obj-id` / player panel anchors. They're drawn in the after-half and stay up while the
  entry is on the stack, replacing nothing: `aim` stays for the hover case.
- Attack arrows and block lines use the same layer.

**Step 5: control and review.** *Done 2026-09-30.* As built: the host's pause, resume and step
(`set-bots-paused`, `step-bots`; while paused the frame gate stays shut even past the ack
timeout, and a step opens it once without the bot-speed linger); a replay button that plays the
last frame again over the board it started from (`usePlayback`'s `replay`, sharing `runFrame`
with the live queue, never acking); History entries that close the log and pulse what they
named on the board (`ui/highlight.ts`); and sound, off by default, synthesised with Web Audio
(`game/sound.ts`) so there was nothing to license. The new top-strip controls are icons: as
words they squeezed the phase track to four steps at 1366px, and the track now keeps the
current step scrolled into view. Original items:
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

## Follow-ups

Moved here from `BACKLOG.md` on 2026-10-04; delete an item when it lands. The problem is that a
bot turn can't be followed by eye, even at the slow bot speed. The kinds of event that hold
the game up for their animation are `PACED` in `client/src/game/animationSchedule.ts`
(cards played, combat hits, deaths and other leaves, taps and untaps, the stack, triggers'
sources, arrivals, counters, buffs, transforms, life and damage, mills, discards, moves and the
crown). Draws and the turn and phase banners animate without holding anything up, and other
events land with the next board without animation. The pipeline is in
`docs/architecture/client.md` (`usePlayback`/`animationBus`/`AnimationLayer`). Each item below is
a small follow-up: a `slotFor` entry (which half of the frame, paced or not, shared beat or
not), then an effect in `AnimationLayer` — an `.animate()` on the tile for an `after` cue, or
`flyGhost` for a move — and each must honour `motionPrefs` (speed and reduced motion).

- **Re-measure the bot speeds.** Most events now hold the game for their animation, and the host
  can pause or step the bots, so `BOT_LINGER_MS` (`server/src/room.ts`: slow 1.6s, normal 0.7s,
  after each frame) may now make "slow" too slow; the library peel has since grown to 1.1s a
  step, too. Watch a 4-player bot game at each speed before changing it.
- **A static buff has no animation.** Anthems and lords (Lord of Lineage's "other Vampires get
  +2/+2") change P/T through the layers without an event, so the tiles just show new numbers.
  `pt-modified` is only a one-shot pump.
- **Cards exiled from a library and put back in the same resolution aren't animated going back**:
  cascade's and discover's misses (and an "exile until" whose rest go to the bottom) peel off the
  pile and the counts run down, then jump back when the board lands. A reverse peel onto the pile
  would close it, once the move back announces itself: `finishCascade` and `placeRevealed` move
  the cards with no event (`cards-put-on-bottom` is only a hand's).
- **A permanent exiled from the battlefield animates filters that don't interpolate**: `runDeath`'s
  exile keyframes go `brightness blur` → `brightness saturate drop-shadow` → `brightness saturate
  blur`, lists that differ, so the filter steps discretely. The mill peel's did the same and
  Chromium painted its last filter from the start (black cards); give every keyframe one list, as
  `peelCards` now does, and look at it live.
- **The crown has only been seen popping in**, not flying between players: that needs one
  player taking the monarchy from another (combat damage), which no dev room sets up. It uses
  the same captured flight as a change of control, which was checked.

Follow-on ideas, approved by the user on 2026-09-30:

- **Tokens merged into an engine stack arrive unanimated**: a second Raise the Alarm's Soldiers
  are folded by the engine into the first two's stack (`stackCount`), so the object their
  `permanent-entered-battlefield` names is gone from the view and nothing plays. The stack's tile
  could glow and say "+2", as a tile the board folded them into already does (`runEnters`).
  Likewise counters put on tokens peeled off a stack and folded back before the frame is drawn
  (`refoldSplitTokens`, Tribute to the World Tree): only the `counter-added` naming the
  surviving stack floats its "+1/+1 ×2"; the rest name objects gone from the view.
- **The board folds identical tokens only when they carry no counters** (`board.ts`'s
  `stackable` needs empty `counters`, though `tileKey` already compares them). Tokens that were
  never one engine stack — three Warriors made below the stacking threshold, then grown alike by
  Cathars' Crusade — stay a tile each. Dropping the condition needs every decision that picks
  from a folded tile to take a fresh member per click first: proliferate's toggle acts on
  `ids[0]` (`pickIdForClick` has no proliferate case), so a folded tile of three could only ever
  give one of them a counter. Found 2026-10-03 (`docs/plans/token-stack-choices.md`).
- **A dies trigger's source can't pulse**: `runPulse` lights the source's tile on the new board,
  and a creature whose own death triggered is gone from it. It would need a pulse in the frame's
  first half, over the old board, for a source that isn't on the new one.
- **A history entry whose cards have left the board highlights nothing**: `highlightEvent` finds
  only what's still drawn (a permanent, a stack entry, your hand, a player's panel). It could
  open the zone the card went to instead.
- **Half the sounds are still synthesised placeholders** (`game/sound.ts`): the table's own noises
  are recorded now (draw, land, shuffle, discard, mill, counters, dice, a countered spell, and
  combat's sword declarations and hits; CC0 packs, `client/public/sfx/CREDITS.md`), but cast,
  death, exile, life, turn and tap are still Web Audio tones. Cues with nothing yet: noncombat damage, bounce, your
  turn and your priority (viewer-only), a player eliminated, defeat (victory has its tune), a token arriving,
  a trigger, a transform, a change of control, and a commander cast; and `game-started`, if a
  frame ever carries it to the client. A new cue is a `SoundCue`, a `SAMPLES` entry and a
  `soundFor` case; an event with no animation needs a `sound` slot (`animationSchedule.ts`).

import type { GameEvent, Phase } from 'engine/client'

/**
 * How long each kind of animation is on screen, at the viewer's normal speed.
 * Every one is multiplied by the viewer's `animScale` (see `motionPrefs.ts`):
 * here for the slots, in `AnimationLayer` for its overlay timeouts, and in
 * App.css as `calc(<ms> * var(--anim-scale))` for the matching
 * `animation-duration`s, so an overlay never outlives the time budgeted for
 * it.
 *
 * Only the ones marked as paced (see `PACED`) also hold the game up.
 * The turn and phase durations are how long that banner shows for, nothing
 * more — the game does not wait on them.
 *
 * A frame is one server push: the events it carries, played in order, and
 * then its board. The server publishes one per bot action and waits for the
 * client to say it's finished (see `server/src/room.ts`), so a frame is a
 * handful of events, not a whole turn's worth.
 */
export const CARD_STEP_MS = 1800
/** Covers LUNGE_DURATION_MS + the hit reaction that starts partway through
 * it (see AnimationLayer), so the next animation doesn't start on top of a
 * creature still shaking. */
export const HIT_STEP_MS = 720
/** A permanent fading off the board. Short on purpose — it's a beat of
 * punctuation after whatever killed it, not an event in its own right. */
export const DEATH_STEP_MS = 420
export const TURN_STEP_MS = 1300
export const PHASE_STEP_MS = 700
/** A cardback travelling from a library to its owner's hand. */
export const DRAW_STEP_MS = 520
/** A permanent tilting to tapped, or back upright. One beat for every tap in
 * the frame (a spell's mana, an untap step), not one each. */
export const TAP_STEP_MS = 260
/** Something leaving the stack: a spell heading for the battlefield or its
 * graveyard, an ability dissolving, a countered spell breaking up. Paced, so
 * a resolve-all (one object per frame) reads as the pile coming down rather
 * than entries blinking out. */
export const STACK_EXIT_MS = 520
/** The permanent a triggered ability came from lighting up as the trigger
 * goes on the stack. One beat for every trigger in the frame. */
export const TRIGGER_STEP_MS = 480
/** How long a revealed card is held up for everyone to read. Longer than a
 * banner because there's a card face to actually take in, and unpaced — the
 * information is already in the History log, so nobody has to catch it. */
export const REVEAL_STEP_MS = 2600
/** How far apart a run of draws in one frame is dealt out, so an opening
 * hand or a "draw three" arrives as cards rather than a single clump. Does
 * not hold the game up — see `PACED`. */
const DRAW_STAGGER_MS = 110
/** Beyond this many draws in one frame, stop animating them: past a handful
 * it's a blizzard of cardbacks nobody is counting, and a mulligan redraw can
 * produce a whole opening hand at once. */
const MAX_DRAWN_PER_FRAME = 5

/**
 * A ceiling on one frame at normal speed. The server's pacing keeps frames
 * small, so this is a backstop for the cases it doesn't cover — a seat
 * auto-passing its own way through several turns with nobody to stop at,
 * most of all. Events past the ceiling are shown without animating: they get
 * no slot *and* no overlay, so nothing ever plays over a board that has
 * moved on, which is what clustering them at the ceiling used to do.
 */
const MAX_FRAME_MS = 6000
/**
 * The ceiling whatever the viewer's speed: `MAX_FRAME_MS` grows with a slower
 * `animScale`, but never past this. It has to stay under the server's
 * `FRAME_ACK_TIMEOUT_MS` (12 s, `server/src/room.ts`), or the server gives up
 * on this seat mid-animation and the bot moves on underneath it.
 */
const FRAME_CEILING_MS = 11000

/**
 * Which half of a frame an animation plays in.
 *
 * `before` runs over the board the frame started from, which is still on
 * screen: a card flying in, a creature striking, a permanent leaving. Those
 * describe the change, so the board mustn't jump to the outcome first.
 *
 * `after` runs over the new board, once it's shown: a tile tilting to
 * tapped. Those describe something only the new board has, so they can't
 * start until it's there. See `usePlayback`.
 */
export type Half = 'before' | 'after'

export interface ScheduledEvent {
  readonly event: GameEvent
  /** Milliseconds from the start of its half at which this event's own
   * animation should fire. */
  readonly offset: number
}

/** The viewer's settings the schedule depends on (see `motionPrefs.ts`),
 * passed in so this module stays free of the DOM and testable on its own. */
export interface ScheduleOptions {
  readonly scale: number
  readonly reduced: boolean
}

const NORMAL_SPEED: ScheduleOptions = { scale: 1, reduced: false }

export interface EventSchedule {
  /** The events animated over the old board — `AnimationLayer` iterates it to
   * know what to trigger and when. */
  readonly items: readonly ScheduledEvent[]
  /**
   * How long to stay on the *previous* board before showing this frame's
   * outcome. Only the animations that describe a change to the board count
   * toward it — see `PACED` below.
   */
  readonly totalMs: number
  /** The events animated over the new board, offsets from when it's shown. */
  readonly after: readonly ScheduledEvent[]
  /** How long to hold the new board before the next frame may start and the
   * server may be told this one is done. */
  readonly afterMs: number
  /** The step-based phase tracking (for skipping a redundant "Beginning
   * Phase" banner/slot right after a turn starts) carries across frames —
   * pass this back in as the next call's `startPhase`. */
  readonly endPhase: Phase
}

type SlotKind =
  | 'card'
  | 'hit'
  | 'death'
  | 'draw'
  | 'turn'
  | 'phase'
  | 'reveal'
  | 'tap'
  | 'untap'
  | 'exit'
  | 'pulse'

/** The kinds that play over the new board rather than the old one. */
const AFTER: ReadonlySet<SlotKind> = new Set<SlotKind>(['tap', 'untap', 'pulse'])

/**
 * Which animations the game actually waits for. A card being played, a
 * creature connecting, a permanent leaving the board, a tile tapping are
 * *what happened*, so the board mustn't move on until they've run. A turn or
 * phase banner is only a caption on top: it holds nothing up, costs no time,
 * and plays over whatever the board has moved on to — otherwise a land the
 * bot played sits in the air for the length of an "End Phase" banner before
 * reaching the table.
 */
const PACED: ReadonlySet<SlotKind> = new Set<SlotKind>([
  'card',
  'hit',
  'death',
  'tap',
  'untap',
  'exit',
  'pulse',
])
/** Kinds where a run in one frame plays together on one beat rather than one
 * after another: a wrath's deaths, a spell's worth of lands tapping. */
const SHARED_BEAT: ReadonlySet<SlotKind> = new Set<SlotKind>(['death', 'tap', 'untap', 'pulse'])

interface Slot {
  readonly event: GameEvent
  readonly kind: SlotKind
  readonly duration: number
}

/** Each event's own reserved slot, or `null` for anything with no dedicated
 * animation. Mutates `phase` so a `step-began` into the *same* phase, or the
 * "beginning" phase a `turn-began` already announced, doesn't also claim
 * one. */
function slotFor(ev: GameEvent, phase: { current: Phase }, reduced: boolean): Slot | null {
  if (ev.type === 'spell-cast' || ev.type === 'land-played') {
    return { event: ev, kind: 'card', duration: CARD_STEP_MS }
  }
  if (ev.type === 'damage-dealt' && ev.combat) {
    return { event: ev, kind: 'hit', duration: HIT_STEP_MS }
  }
  if (ev.type === 'permanent-left-battlefield') {
    return { event: ev, kind: 'death', duration: DEATH_STEP_MS }
  }
  // Leaving the stack plays over the old board, where the entry still is.
  // Kept under reduced motion as a fade: it's the only sign the object has
  // gone, and which way (resolved, countered).
  if (
    ev.type === 'spell-resolved' ||
    ev.type === 'ability-resolved' ||
    ev.type === 'spell-countered' ||
    ev.type === 'spell-fizzled'
  ) {
    return { event: ev, kind: 'exit', duration: STACK_EXIT_MS }
  }
  // A trigger's source lights up over the new board, where its ability has
  // just joined the stack. A colour cue, so reduced motion keeps it.
  if (ev.type === 'ability-triggered') {
    return { event: ev, kind: 'pulse', duration: TRIGGER_STEP_MS }
  }
  // Pure movement, so reduced motion leaves nothing to show: the tile is
  // simply drawn tapped, and the hand simply has one more card.
  if (ev.type === 'permanent-tapped' || ev.type === 'permanent-untapped') {
    if (reduced) return null
    // Separate kinds, so an untap step followed by tapping for mana reads as
    // two moves rather than one blur of tiles going both ways.
    const kind = ev.type === 'permanent-tapped' ? 'tap' : 'untap'
    return { event: ev, kind, duration: TAP_STEP_MS }
  }
  if (ev.type === 'card-drawn') {
    return reduced ? null : { event: ev, kind: 'draw', duration: DRAW_STEP_MS }
  }
  if (ev.type === 'cards-revealed') {
    return { event: ev, kind: 'reveal', duration: REVEAL_STEP_MS }
  }
  if (ev.type === 'turn-began') {
    phase.current = 'beginning'
    return { event: ev, kind: 'turn', duration: TURN_STEP_MS }
  }
  if (ev.type === 'step-began') {
    if (ev.phase === phase.current) return null
    phase.current = ev.phase
    return { event: ev, kind: 'phase', duration: PHASE_STEP_MS }
  }
  return null
}

export function scheduleEvents(
  events: readonly GameEvent[],
  startPhase: Phase,
  options: ScheduleOptions = NORMAL_SPEED,
): EventSchedule {
  const { scale, reduced } = options
  const phase = { current: startPhase }
  const slots: Slot[] = []
  for (const event of events) {
    const slot = slotFor(event, phase, reduced)
    if (slot !== null) slots.push(slot)
  }

  // Announce only the phase a frame *lands* in, not every one it passed
  // through. A frame shows exactly one board — its own end state — so a
  // banner for an intermediate phase describes a board nobody will ever see,
  // and a seat auto-passing whole turns produces a dozen of them in a single
  // frame. A turn change is a real beat and always keeps its banner.
  let laterBoundary = false
  const kept: Slot[] = []
  for (let i = slots.length - 1; i >= 0; i -= 1) {
    const slot = slots[i]
    if (slot.kind === 'phase' && laterBoundary) continue
    if (slot.kind === 'phase' || slot.kind === 'turn') laterBoundary = true
    kept.push(slot)
  }
  kept.reverse()

  // One ceiling for both halves together: it's the whole frame the server
  // waits on.
  const ceiling = Math.min(MAX_FRAME_MS * scale, FRAME_CEILING_MS)
  const before = layOut(
    kept.filter((s) => !AFTER.has(s.kind)),
    scale,
    ceiling,
  )
  const after = layOut(
    kept.filter((s) => AFTER.has(s.kind)),
    scale,
    ceiling - before.totalMs,
  )
  return {
    items: before.items,
    totalMs: before.totalMs,
    after: after.items,
    afterMs: after.totalMs,
    endPhase: phase.current,
  }
}

/** One half's slots, laid end to end. The first paced slot that won't fit
 * under `ceiling` ends the half: it and everything after it are simply not
 * animated (the phase tracking has still been advanced, so the next frame's
 * banners stay right). Stopping there rather than skipping to whatever fits
 * keeps what's shown in order. */
function layOut(
  slots: readonly Slot[],
  scale: number,
  ceiling: number,
): { items: ScheduledEvent[]; totalMs: number } {
  const items: ScheduledEvent[] = []
  let cumulative = 0
  // A run of one shared-beat kind (see `SHARED_BEAT`) goes together at the
  // offset the first of them got — the board is showing them all happen at
  // once, because they did.
  let shared: { kind: SlotKind; offset: number } | null = null
  let drawsSoFar = 0
  for (const slot of slots) {
    if (cumulative >= ceiling) break
    if (shared !== null && shared.kind === slot.kind) {
      items.push({ event: slot.event, offset: shared.offset })
      continue
    }
    if (slot.kind === 'draw') {
      // Dealt out one after another without the game waiting on any of them.
      if (drawsSoFar >= MAX_DRAWN_PER_FRAME) continue
      items.push({
        event: slot.event,
        offset: cumulative + drawsSoFar * DRAW_STAGGER_MS * scale,
      })
      drawsSoFar += 1
      continue
    }
    const cost = PACED.has(slot.kind) ? slot.duration * scale : 0
    if (cumulative + cost > ceiling) break
    items.push({ event: slot.event, offset: cumulative })
    shared = SHARED_BEAT.has(slot.kind) ? { kind: slot.kind, offset: cumulative } : null
    cumulative += cost
  }
  return { items, totalMs: cumulative }
}

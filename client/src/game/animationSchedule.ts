import type { GameEvent, Phase } from 'engine'

/**
 * How long each kind of animation is on screen. `AnimationLayer` imports
 * these for its own overlay timeouts and the matching CSS
 * `animation-duration`s in App.css are written to the same numbers, so an
 * overlay never outlives the time budgeted for it.
 *
 * Only the two below marked as paced (see `PACED`) also hold the game up.
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
 * A ceiling on one frame. The server's pacing keeps frames small, so this is
 * a backstop for the cases it doesn't cover — a seat auto-passing its own
 * way through several turns with nobody to stop at, most of all. Events past
 * the ceiling are shown without animating: they get no slot *and* no
 * overlay, so nothing ever plays over a board that has moved on, which is
 * what clustering them at the ceiling used to do.
 */
const MAX_FRAME_MS = 6000

export interface ScheduledEvent {
  readonly event: GameEvent
  /** Milliseconds from the start of this frame at which this event's own
   * animation should fire. */
  readonly offset: number
}

export interface EventSchedule {
  /** Only the events that actually get an animation — the playback hook
   * doesn't need this list at all, but `AnimationLayer` iterates it to know
   * what to trigger and when. */
  readonly items: readonly ScheduledEvent[]
  /**
   * How long to stay on the *previous* board before showing this frame's
   * outcome, and so how long before the next frame may start and the server
   * may be told this one is done. Only the animations that describe a change
   * to the board count toward it — see `PACED` below.
   */
  readonly totalMs: number
  /** The step-based phase tracking (for skipping a redundant "Beginning
   * Phase" banner/slot right after a turn starts) carries across frames —
   * pass this back in as the next call's `startPhase`. */
  readonly endPhase: Phase
}

type SlotKind = 'card' | 'hit' | 'death' | 'draw' | 'turn' | 'phase' | 'reveal'

/**
 * Which animations the game actually waits for. A card being played, a
 * creature connecting, a permanent leaving the board are *what happened*, so
 * the board mustn't jump to the outcome until they've run. A turn or phase
 * banner is only a caption on top: it holds nothing up, costs no time, and
 * plays over whatever the board has moved on to — otherwise a land the bot
 * played sits in the air for the length of an "End Phase" banner before
 * reaching the table.
 */
const PACED: ReadonlySet<SlotKind> = new Set<SlotKind>(['card', 'hit', 'death'])

interface Slot {
  readonly event: GameEvent
  readonly kind: SlotKind
  readonly duration: number
}

/** Each event's own reserved slot, or `null` for anything with no dedicated
 * animation. Mutates `phase` so a `step-began` into the *same* phase, or the
 * "beginning" phase a `turn-began` already announced, doesn't also claim
 * one. */
function slotFor(ev: GameEvent, phase: { current: Phase }): Slot | null {
  if (ev.type === 'spell-cast' || ev.type === 'land-played') {
    return { event: ev, kind: 'card', duration: CARD_STEP_MS }
  }
  if (ev.type === 'damage-dealt' && ev.combat) {
    return { event: ev, kind: 'hit', duration: HIT_STEP_MS }
  }
  if (ev.type === 'permanent-left-battlefield') {
    return { event: ev, kind: 'death', duration: DEATH_STEP_MS }
  }
  if (ev.type === 'card-drawn') {
    return { event: ev, kind: 'draw', duration: DRAW_STEP_MS }
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
): EventSchedule {
  const phase = { current: startPhase }
  const slots: Slot[] = []
  for (const event of events) {
    const slot = slotFor(event, phase)
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

  const items: ScheduledEvent[] = []
  let cumulative = 0
  // A run of permanents leaving at once (a wrath, a creature and the Aura
  // that fell off it) fades together on one beat rather than queueing up one
  // death-length each — the board is showing them all go at the same moment,
  // because they did.
  let sharedDeathOffset: number | null = null
  let drawsSoFar = 0
  for (const slot of kept) {
    // Past the ceiling an event is simply not animated — the phase tracking
    // above has still been advanced, so the next frame's banners stay right.
    if (cumulative >= MAX_FRAME_MS) continue
    if (slot.kind === 'death' && sharedDeathOffset !== null) {
      items.push({ event: slot.event, offset: sharedDeathOffset })
      continue
    }
    if (slot.kind === 'draw') {
      // Dealt out one after another without the game waiting on any of them.
      if (drawsSoFar >= MAX_DRAWN_PER_FRAME) continue
      items.push({ event: slot.event, offset: cumulative + drawsSoFar * DRAW_STAGGER_MS })
      drawsSoFar += 1
      continue
    }
    items.push({ event: slot.event, offset: cumulative })
    sharedDeathOffset = slot.kind === 'death' ? cumulative : null
    if (PACED.has(slot.kind)) cumulative += slot.duration
  }
  return { items, totalMs: cumulative, endPhase: phase.current }
}

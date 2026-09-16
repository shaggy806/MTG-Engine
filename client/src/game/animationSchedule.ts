import type { GameEvent, Phase } from 'engine'

/**
 * How much real time each kind of animate-worthy event reserves for itself
 * inside a frame. These are the single source of truth for *both* the slot
 * an event claims here and the on-screen lifetime of the overlay that plays
 * in it (`AnimationLayer` imports them for its own overlay timeouts, and the
 * matching CSS `animation-duration`s in App.css are written to the same
 * numbers) — so nothing outlives its slot and leaves the next animation
 * starting on top of it.
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
export const TURN_STEP_MS = 1300
export const PHASE_STEP_MS = 700

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
   * doesn't need this list at all (it only cares about `totalMs`), but
   * `AnimationLayer` iterates it to know what to trigger and when. */
  readonly items: readonly ScheduledEvent[]
  /** How long to stay on the *previous* board before showing this frame's
   * outcome. */
  readonly totalMs: number
  /** The step-based phase tracking (for skipping a redundant "Beginning
   * Phase" banner/slot right after a turn starts) carries across frames —
   * pass this back in as the next call's `startPhase`. */
  readonly endPhase: Phase
}

/** Each event's own reserved slot, in the order they appear — 0 for
 * anything with no dedicated animation. Mutates `phase` so a `step-began`
 * into the *same* phase, or the "beginning" phase a `turn-began` already
 * announced, doesn't also claim a slot. */
function stepDuration(ev: GameEvent, phase: { current: Phase }): number {
  if (ev.type === 'spell-cast' || ev.type === 'land-played') return CARD_STEP_MS
  if (ev.type === 'damage-dealt' && ev.combat) return HIT_STEP_MS
  if (ev.type === 'turn-began') {
    phase.current = 'beginning'
    return TURN_STEP_MS
  }
  if (ev.type === 'step-began') {
    if (ev.phase === phase.current) return 0
    phase.current = ev.phase
    return PHASE_STEP_MS
  }
  return 0
}

export function scheduleEvents(
  events: readonly GameEvent[],
  startPhase: Phase,
): EventSchedule {
  const phase = { current: startPhase }
  const items: ScheduledEvent[] = []
  let cumulative = 0
  for (const event of events) {
    const duration = stepDuration(event, phase)
    if (duration === 0) continue
    // Past the ceiling an event is simply not animated — the phase tracking
    // above has still been advanced, so the next frame's banners stay right.
    if (cumulative >= MAX_FRAME_MS) continue
    items.push({ event, offset: cumulative })
    cumulative += duration
  }
  return { items, totalMs: cumulative, endPhase: phase.current }
}

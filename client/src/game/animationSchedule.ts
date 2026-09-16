import type { GameEvent, Phase } from 'engine'

/**
 * How much real time each kind of animate-worthy event reserves for itself
 * in the pacing timeline below. These are the single source of truth for
 * *both* the pacing slot an event claims here and the on-screen lifetime of
 * the overlay that plays in it (`AnimationLayer` imports them for its own
 * overlay timeouts, and the matching CSS `animation-duration`s in App.css
 * are written to the same numbers) — an overlay that outlived its slot used
 * to leave the banner queue lagging further behind the board with every
 * turn, so the two must not drift.
 *
 * `animationQueue.ts` chains each push's schedule onto the tail of the
 * previous one, so a bot that plays a land, casts a creature and passes the
 * turn in three separate server pushes reads as three things happening in a
 * row rather than three overlapping animations over an already-finished
 * board.
 */
export const CARD_STEP_MS = 1800
/** Covers LUNGE_DURATION_MS + the hit reaction that starts partway through
 * it (see AnimationLayer), so the next animation doesn't start on top of a
 * creature still shaking. */
export const HIT_STEP_MS = 720
export const TURN_STEP_MS = 1300
export const PHASE_STEP_MS = 700
/** A ceiling on a *single batch's* total, regardless of how many
 * animate-worthy events it carries (a bot dumping its whole hand in one
 * push, say). Events past the ceiling still get their own overlay/hit
 * animation (scheduled at the ceiling, so they cluster near the end rather
 * than firing individually beyond it), just without their own extra pacing
 * slot. The queue's own backlog ceiling is separate — see
 * `MAX_BACKLOG_MS` in animationQueue.ts. */
const MAX_TOTAL_MS = 9000

export interface ScheduledEvent {
  readonly event: GameEvent
  /** Milliseconds from the start of this batch at which this event's own
   * animation should fire. */
  readonly offset: number
}

export interface EventSchedule {
  /** Only the events that actually get an animation — `useDelayedView`
   * doesn't need this list at all (it only cares about `totalMs`), but
   * `AnimationLayer` iterates it to know what to trigger and when. */
  readonly items: readonly ScheduledEvent[]
  /** How long `Table` should stay on the *previous* board before jumping to
   * this batch's outcome. */
  readonly totalMs: number
  /** The step-based phase tracking (for skipping a redundant "Beginning
   * Phase" banner/slot right after a turn starts) carries across batches —
   * pass this back in as the next call's `startPhase`. */
  readonly endPhase: Phase
}

/** Each event's own reserved slot, in the order they appear — 0 for
 * anything with no dedicated animation. Mutates `phase` (a la `lastPhaseRef`
 * in the two callers) so a `step-began` into the *same* phase, or the
 * "beginning" phase a `turn-began` already announced, doesn't also claim a
 * slot. */
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
    const offset = Math.min(cumulative, MAX_TOTAL_MS)
    const duration = stepDuration(event, phase)
    if (duration > 0) items.push({ event, offset })
    cumulative += duration
  }
  return { items, totalMs: Math.min(cumulative, MAX_TOTAL_MS), endPhase: phase.current }
}

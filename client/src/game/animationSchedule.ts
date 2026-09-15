import type { GameEvent, Phase } from 'engine'

/**
 * How much real time each kind of animate-worthy event reserves for itself
 * in the pacing timeline below — shared by `useDelayedView` (which holds
 * `Table` back for the batch's total) and `AnimationLayer` (which schedules
 * each individual animation at its own offset within that total), so a bot
 * turn that plays three creatures and swings twice reads as five separate
 * things happening in sequence rather than one instant board flip with five
 * animations firing on top of each other. Kept in one place so the two never
 * disagree about timing.
 */
const CARD_STEP_MS = 1800
const HIT_STEP_MS = 650
const TURN_STEP_MS = 900
const PHASE_STEP_MS = 500
/** A hard ceiling on the total, regardless of how many animate-worthy events
 * are in one batch (a bot dumping its whole hand, say) — long enough to read
 * as "several things happened," never so long the game feels stuck. Events
 * past the ceiling still get their own overlay/hit animation (scheduled at
 * the ceiling, so they cluster near the end rather than firing individually
 * beyond it), just without their own extra pacing slot. */
const MAX_TOTAL_MS = 6000

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

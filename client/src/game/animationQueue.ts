import type { GameEvent, Phase } from 'engine'
import { scheduleEvents } from './animationSchedule.ts'

/**
 * The one shared animation timeline the whole client is paced against.
 *
 * A server push is *not* one turn's worth of events: `Room.settle()` pushes
 * after every stopping point, so a bot that plays a land, casts a creature
 * and passes arrives as several pushes in quick succession. Scheduling each
 * push independently (what `useDelayedView`/`AnimationLayer` each used to do
 * on their own) meant a push landing while the previous one's animations
 * were still playing either overlapped them or, worse, was swallowed
 * entirely — the board jumped straight to "land and creature already on the
 * battlefield, turn passed" while the card-fly overlays were still in the
 * air.
 *
 * So batches queue instead: `enqueue` appends a push's events to the tail of
 * whatever is still playing and reports back the absolute time at which the
 * whole queue (this batch included) is finally drained. `useDelayedView`
 * holds that push's board state until exactly then, and `AnimationLayer`
 * (the single subscriber) fires each cue at its own offset from *now*, so
 * the board and its animations advance in lockstep and nothing — neither a
 * bot's next move nor the player's own, since `busy` empties the action list
 * — gets ahead of what's on screen.
 *
 * Module state rather than a hook/context: there is exactly one game on
 * screen at a time and exactly two consumers of this timeline, and both sit
 * in `GameScreen` where prop-threading a queue between a hook and a sibling
 * component would be pure ceremony. `reset` puts it back to a clean slate.
 */

export interface AnimationCue {
  readonly event: GameEvent
  /** Milliseconds from the moment this cue was published until its own
   * animation should fire. */
  readonly delay: number
}

type Listener = (cues: readonly AnimationCue[]) => void

/** How far behind real time the timeline is ever allowed to fall. Past this,
 * a new batch starts anyway rather than queueing further out — animations
 * overlap again, which is the lesser evil versus a table that is visibly
 * half a minute behind the game it is showing (a seat auto-passing whole
 * turns against three bots can generate pushes far faster than they can be
 * played out). */
const MAX_BACKLOG_MS = 12000

let busyUntil = 0
let phase: Phase = 'beginning'
let listener: Listener | null = null

export function resetAnimationQueue(startPhase: Phase): void {
  busyUntil = 0
  phase = startPhase
}

/** Only ever one subscriber (`AnimationLayer`); a second one replaces it. */
export function subscribeAnimations(fn: Listener): () => void {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}

/**
 * Appends one push's new events to the tail of the timeline, publishes their
 * cues, and returns the `performance.now()` timestamp at which everything
 * queued so far has finished playing — i.e. when this push's board state is
 * safe to show.
 *
 * Called once per push, by `useDelayedView` only: it advances the timeline,
 * so a second caller would double-count every batch.
 */
export function enqueueAnimations(events: readonly GameEvent[]): number {
  const now = performance.now()
  const start = Math.min(Math.max(now, busyUntil), now + MAX_BACKLOG_MS)
  if (events.length === 0) {
    busyUntil = start
    return busyUntil
  }
  const schedule = scheduleEvents(events, phase)
  phase = schedule.endPhase
  busyUntil = start + schedule.totalMs
  if (listener && schedule.items.length > 0) {
    const lead = start - now
    listener(schedule.items.map((i) => ({ event: i.event, delay: lead + i.offset })))
  }
  return busyUntil
}

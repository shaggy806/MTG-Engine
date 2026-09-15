import { useEffect, useRef, useState } from 'react'
import type { LegalAction, Phase, PlayerView } from 'engine'
import { phaseOfStep } from 'engine'
import { scheduleEvents } from './animationSchedule.ts'

export interface DelayedView {
  readonly view: PlayerView | null
  readonly actions: readonly LegalAction[]
  /** Bumps only when `view`/`actions` actually change here — for `Table`'s
   * own `key`, so its local click-in-progress state resets in step with what
   * the player can see, not with every network push that arrives while a
   * previous one is still being held back. */
  readonly revision: number
  /** True from the moment a batch of new events arrives until its scheduled
   * animations have finished — `GameScreen` feeds `Table` an empty action
   * list for as long as this is true (see its own comment), so neither a
   * human nor a bot's own next move can jump ahead of what's still playing
   * out on screen. */
  readonly busy: boolean
}

/**
 * Holds `Table` back from a raw network `view`/`actions` push for exactly as
 * long as `scheduleEvents` says the batch's animations need (see
 * `animationSchedule.ts`) — otherwise the board jumps straight to the end
 * state (every card already on the battlefield, a life total already down)
 * while the animations for *how it got there* are still playing, or haven't
 * even started. `AnimationLayer` itself always reacts to the raw (undelayed)
 * view — it needs the new objects/events the instant they exist, and reads
 * the DOM for lunge/hit positions, which during the hold is still whatever
 * `Table` last rendered, i.e. exactly the "before" picture an animation
 * needs — and schedules each event's own animation at the same offsets this
 * hook computes the total from, so a busy batch (several things a bot did in
 * one turn) plays as a sequence instead of firing all at once.
 *
 * A batch that arrives while a previous one is still being held is not used
 * to extend the wait — only to supply the freshest state once the current
 * hold ends — so total added latency is bounded by one batch's schedule, not
 * however fast updates happen to arrive.
 */
export function useDelayedView(
  view: PlayerView | null,
  actions: readonly LegalAction[],
): DelayedView {
  const [displayed, setDisplayed] = useState<DelayedView>({
    view,
    actions,
    revision: 0,
    busy: false,
  })
  const prevEventLenRef = useRef(view?.events.length ?? 0)
  const lastPhaseRef = useRef<Phase>(view ? phaseOfStep(view.turn.step) : 'beginning')
  const timerRef = useRef<number | null>(null)
  const latestRef = useRef({ view, actions })
  const revisionRef = useRef(0)

  useEffect(() => {
    latestRef.current = { view, actions }
    if (view === null) {
      revisionRef.current += 1
      setDisplayed({ view, actions, revision: revisionRef.current, busy: false })
      return
    }
    const from = prevEventLenRef.current
    prevEventLenRef.current = view.events.length
    if (timerRef.current !== null) return // already counting down; the eventual flush uses latestRef
    if (from >= view.events.length) {
      revisionRef.current += 1
      setDisplayed({ view, actions, revision: revisionRef.current, busy: false })
      return
    }
    const schedule = scheduleEvents(view.events.slice(from), lastPhaseRef.current)
    lastPhaseRef.current = schedule.endPhase
    if (schedule.totalMs === 0) {
      revisionRef.current += 1
      setDisplayed({ view, actions, revision: revisionRef.current, busy: false })
      return
    }
    setDisplayed((cur) => ({ ...cur, busy: true }))
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      revisionRef.current += 1
      setDisplayed({ ...latestRef.current, revision: revisionRef.current, busy: false })
    }, schedule.totalMs)
  }, [view, actions])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return displayed
}

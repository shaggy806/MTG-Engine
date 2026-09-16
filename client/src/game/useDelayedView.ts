import { useCallback, useEffect, useRef, useState } from 'react'
import type { LegalAction, PlayerView } from 'engine'
import { phaseOfStep } from 'engine'
import { enqueueAnimations, resetAnimationQueue } from './animationQueue.ts'

export interface DelayedView {
  readonly view: PlayerView | null
  readonly actions: readonly LegalAction[]
  /** Bumps only when `view`/`actions` actually change here — for `Table`'s
   * own `key`, so its local click-in-progress state resets in step with what
   * the player can see, not with every network push that arrives while a
   * previous one is still being held back. */
  readonly revision: number
  /** True from the moment a push with new events arrives until every queued
   * push has been released — `GameScreen` feeds `Table` an empty action list
   * for as long as this is true (see its own comment), so neither a human
   * nor a bot's own next move can jump ahead of what's still playing out on
   * screen. */
  readonly busy: boolean
}

interface HeldPush {
  readonly view: PlayerView
  readonly actions: readonly LegalAction[]
  /** `performance.now()` timestamp at which this push's animations have
   * finished and its board state may be shown. */
  readonly releaseAt: number
}

/**
 * Holds `Table` back from a raw network `view`/`actions` push for exactly as
 * long as the shared animation timeline says the events in it need (see
 * `animationQueue.ts`) — otherwise the board jumps straight to the end state
 * (every card already on the battlefield, a life total already down) while
 * the animations for *how it got there* are still playing, or haven't even
 * started.
 *
 * Pushes are held in a **queue**, one entry each, rather than collapsed into
 * "whatever arrived most recently": a bot's turn arrives as a rapid burst of
 * separate pushes (the server settles and pushes after every stopping
 * point), and releasing them one at a time, each as its own animations
 * finish, is what makes "played a land, then cast a creature, then passed"
 * read as three things instead of one instant flip. Entries that are already
 * overdue when the pump runs collapse into the newest of them, so a backlog
 * catches up rather than replaying stale boards.
 *
 * `AnimationLayer` itself always reacts to the raw (undelayed) view — it
 * needs the new objects/events the instant they exist, and reads the DOM for
 * lunge/hit positions, which during the hold is still whatever `Table` last
 * rendered, i.e. exactly the "before" picture an animation needs — and gets
 * its cues from the same queue this hook enqueues into, so the two can't
 * disagree about when anything happens.
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
  const queueRef = useRef<HeldPush[]>([])
  const timerRef = useRef<number | null>(null)
  const revisionRef = useRef(0)

  // The timeline is module state (one game on screen at a time), so a fresh
  // mount has to clear whatever a previous one left behind. Mount-only on
  // purpose — it's the "start from here" reset, not a per-push one — so the
  // seed phase is read from a ref rather than closing over `view`.
  const startPhaseRef = useRef(view ? phaseOfStep(view.turn.step) : 'beginning')
  useEffect(() => {
    resetAnimationQueue(startPhaseRef.current)
  }, [])

  /** Releases every queued push that is already due (showing the last of
   * them) and arms a timer for the next one. Touches only refs, so it's
   * stable and safe to call from a timer callback. */
  // A *named* function expression so the re-arm below recurses through its
  // own binding rather than the `const` it's being assigned to.
  const pump = useCallback(function pumpQueue(): void {
    if (timerRef.current !== null) return
    const queue = queueRef.current
    const now = performance.now()
    let released: HeldPush | null = null
    // 1ms of slack: a timer that fires a hair early shouldn't re-arm itself.
    while (queue.length > 0 && queue[0].releaseAt <= now + 1) released = queue.shift() ?? null
    const busy = queue.length > 0
    if (released) {
      revisionRef.current += 1
      setDisplayed({
        view: released.view,
        actions: released.actions,
        revision: revisionRef.current,
        busy,
      })
    } else {
      // Returning `cur` unchanged bails the re-render out entirely.
      setDisplayed((cur) => (cur.busy === busy ? cur : { ...cur, busy }))
    }
    if (queue.length > 0) {
      timerRef.current = window.setTimeout(
        () => {
          timerRef.current = null
          pumpQueue()
        },
        Math.max(0, queue[0].releaseAt - performance.now()),
      )
    }
  }, [])

  useEffect(() => {
    if (view === null) {
      queueRef.current = []
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      revisionRef.current += 1
      setDisplayed({ view, actions, revision: revisionRef.current, busy: false })
      return
    }
    const from = prevEventLenRef.current
    prevEventLenRef.current = view.events.length
    const fresh = from < view.events.length ? view.events.slice(from) : []
    // Enqueued even when there's nothing new to animate: the push still has
    // to wait its turn behind whatever is already playing, or a bare
    // state refresh would overtake the board it belongs after.
    const releaseAt = enqueueAnimations(fresh)
    queueRef.current.push({ view, actions, releaseAt })
    pump()
  }, [view, actions, pump])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return displayed
}

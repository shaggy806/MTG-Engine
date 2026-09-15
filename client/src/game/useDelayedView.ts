import { useEffect, useRef, useState } from 'react'
import type { GameEvent, LegalAction, PlayerView } from 'engine'

/**
 * How long `Table` holds the *previous* board before jumping to a batch of
 * new events, keyed by the most attention-grabbing thing in that batch (the
 * max across the batch, not a sum — several things happening in one network
 * round trip shouldn't compound into a sluggish board, just enough of a hold
 * for the most prominent animation to read before the board catches up to
 * it). Capped by MAX_DELAY_MS so a big batch (an empty bot turn zipping
 * through several steps at once) never leaves the board stale for long.
 */
const CARD_PLAYED_DELAY_MS = 650
const COMBAT_HIT_DELAY_MS = 550
const ATTACKER_DECLARED_DELAY_MS = 250
const TURN_BEGAN_DELAY_MS = 500
const STEP_BEGAN_DELAY_MS = 300
const MAX_DELAY_MS = 900

function delayForEvents(events: readonly GameEvent[]): number {
  let delay = 0
  for (const ev of events) {
    if (ev.type === 'spell-cast' || ev.type === 'land-played') {
      delay = Math.max(delay, CARD_PLAYED_DELAY_MS)
    } else if (ev.type === 'damage-dealt' && ev.combat) {
      delay = Math.max(delay, COMBAT_HIT_DELAY_MS)
    } else if (ev.type === 'attacker-declared') {
      delay = Math.max(delay, ATTACKER_DECLARED_DELAY_MS)
    } else if (ev.type === 'turn-began') {
      delay = Math.max(delay, TURN_BEGAN_DELAY_MS)
    } else if (ev.type === 'step-began') {
      delay = Math.max(delay, STEP_BEGAN_DELAY_MS)
    }
  }
  return Math.min(delay, MAX_DELAY_MS)
}

export interface DelayedView {
  readonly view: PlayerView | null
  readonly actions: readonly LegalAction[]
  /** Bumps only when `view`/`actions` actually change here — for `Table`'s
   * own `key`, so its local click-in-progress state resets in step with what
   * the player can see, not with every network push that arrives while a
   * previous one is still being held back. */
  readonly revision: number
}

/**
 * Holds `Table` back from a raw network `view`/`actions` push just long
 * enough for `AnimationLayer` to have shown something for it first —
 * otherwise the board jumps straight to the end state (a card already on the
 * battlefield, a life total already down) while the animation for *how it
 * got there* is still catching up behind it. `AnimationLayer` itself always
 * reacts to the raw (undelayed) view — it needs the new objects/events the
 * instant they exist — and reads the DOM for lunge/hit positions, which
 * during the hold is still whatever `Table` last rendered, i.e. exactly the
 * "before" picture an animation needs.
 *
 * A batch that arrives while a previous one is still being held is not used
 * to extend the wait — only to supply the freshest state once the current
 * hold ends — so total added latency is bounded by one MAX_DELAY_MS, not
 * however fast updates happen to arrive.
 */
export function useDelayedView(
  view: PlayerView | null,
  actions: readonly LegalAction[],
): DelayedView {
  const [displayed, setDisplayed] = useState<DelayedView>({ view, actions, revision: 0 })
  const prevEventLenRef = useRef(view?.events.length ?? 0)
  const timerRef = useRef<number | null>(null)
  const latestRef = useRef({ view, actions })
  const revisionRef = useRef(0)

  useEffect(() => {
    latestRef.current = { view, actions }
    if (view === null) {
      revisionRef.current += 1
      setDisplayed({ view, actions, revision: revisionRef.current })
      return
    }
    const from = prevEventLenRef.current
    prevEventLenRef.current = view.events.length
    if (timerRef.current !== null) return // already counting down; the eventual flush uses latestRef
    const delay = from < view.events.length ? delayForEvents(view.events.slice(from)) : 0
    if (delay === 0) {
      revisionRef.current += 1
      setDisplayed({ view, actions, revision: revisionRef.current })
      return
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      revisionRef.current += 1
      setDisplayed({ ...latestRef.current, revision: revisionRef.current })
    }, delay)
  }, [view, actions])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return displayed
}

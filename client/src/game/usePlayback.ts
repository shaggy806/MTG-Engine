import { useCallback, useEffect, useRef, useState } from 'react'
import type { LegalAction, PlayerView } from 'engine'
import { phaseOfStep } from 'engine'
import { scheduleEvents } from './animationSchedule.ts'
import type { AnimationBus } from './animationBus.ts'

/** One server push: the events since the previous frame, the board they
 * settled into, and what this seat may do once it's shown. */
export interface Frame {
  readonly seq: number
  readonly view: PlayerView
  readonly actions: readonly LegalAction[]
}

export interface Playback {
  readonly view: PlayerView | null
  readonly actions: readonly LegalAction[]
  /** Bumps once per frame actually shown — for `Table`'s `key`, so its local
   * click-in-progress state resets in step with what the player can see
   * rather than with every push that arrives mid-animation. */
  readonly revision: number
  /** A frame is playing, or one is waiting behind it. Nothing may be clicked
   * while this holds: those actions belong to a board that isn't on screen
   * yet. */
  readonly busy: boolean
}

/**
 * How many frames may pile up before playback stops animating and starts
 * catching up. The server only lets a bot move on once this client says it
 * has caught up, so a backlog means this tab has stopped keeping time at all
 * — a backgrounded tab throttles its timers to roughly one tick a second,
 * and the server's own wait times out and moves on without us. Nobody is
 * watching those frames, so they're shown rather than played.
 */
const MAX_QUEUED_FRAMES = 4

/**
 * Plays the server's frames out one at a time and reports what the player
 * should currently be looking at.
 *
 * Each frame's animations run against the board *before* it — the previous
 * frame's, still on screen — and only when they finish does the new board
 * replace it. That ordering is the whole point: the card-fly overlay for a
 * land has to play while the battlefield still doesn't have that land on it,
 * or the animation is just decoration over an outcome already visible.
 *
 * `onShown` fires as each frame lands, and the caller turns that into the
 * `ack` the server paces its bots against, so a bot's next move can't start
 * until this client has finished showing the last one.
 */
export function usePlayback(
  frame: Frame | null,
  bus: AnimationBus,
  onShown: (seq: number) => void,
): Playback {
  const [displayed, setDisplayed] = useState<Playback>({
    view: frame?.view ?? null,
    actions: frame?.actions ?? [],
    revision: 0,
    busy: false,
  })

  const queueRef = useRef<Frame[]>([])
  const playingRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const revisionRef = useRef(0)
  /** How many events of the game's log have already been played out, so a
   * frame only animates what it actually added. Seeded from the frame this
   * hook mounted on — whatever happened before the player got here (a whole
   * game, on a mid-game reconnect) is history, not something to replay. */
  const shownEventsRef = useRef(frame?.view.events.length ?? 0)
  /** Deliberately behind the mounting frame, so that frame still goes
   * through the queue: it animates nothing (see `shownEventsRef`) but it
   * does get shown and, more to the point, acked. */
  const lastQueuedSeqRef = useRef(-1)
  const phaseRef = useRef(frame ? phaseOfStep(frame.view.turn.step) : 'beginning')

  // Read through refs so the playback loop below doesn't have to be rebuilt
  // (and every in-flight timer torn down) each time a new push re-renders.
  // Synced in an effect declared *above* the queueing one, so it's already
  // current by the time a newly-arrived frame starts playing.
  const onShownRef = useRef(onShown)
  const busRef = useRef(bus)
  useEffect(() => {
    onShownRef.current = onShown
    busRef.current = bus
  }, [onShown, bus])

  /** Starts the next queued frame if nothing is playing. Touches only refs,
   * so it's stable and safe to call from a timer. A *named* function
   * expression so it can recurse through its own binding rather than the
   * `const` it's assigned to. */
  const play = useCallback(function playNext(): void {
    if (playingRef.current) return
    const queue = queueRef.current

    // Fallen behind (see MAX_QUEUED_FRAMES): drop the oldest frames'
    // animations, still acking them, so the backlog drains in one go rather
    // than playing out a minute of a game nobody watched.
    while (queue.length > MAX_QUEUED_FRAMES) {
      const skipped = queue.shift()
      if (!skipped) break
      shownEventsRef.current = skipped.view.events.length
      phaseRef.current = phaseOfStep(skipped.view.turn.step)
      onShownRef.current(skipped.seq)
    }

    const next = queue.shift()
    if (!next) return
    playingRef.current = true

    const total = next.view.events.length
    // A reconnect (or a different game entirely) can hand back a shorter log
    // than we've already shown; there's nothing sensible to animate then.
    const from = shownEventsRef.current <= total ? shownEventsRef.current : total
    shownEventsRef.current = total
    const schedule = scheduleEvents(next.view.events.slice(from), phaseRef.current)
    phaseRef.current = schedule.endPhase
    busRef.current.publish(
      schedule.items.map((i) => ({ event: i.event, view: next.view, delay: i.offset })),
    )

    // `totalMs` counts only the animations the game waits for (see
    // animationSchedule's PACED), so a frame carrying nothing but banners
    // lands at once and the banners play over the board that follows it.
    const show = (): void => {
      timerRef.current = null
      playingRef.current = false
      revisionRef.current += 1
      setDisplayed({
        view: next.view,
        actions: next.actions,
        revision: revisionRef.current,
        busy: queueRef.current.length > 0,
      })
      onShownRef.current(next.seq)
      playNext()
    }

    if (schedule.totalMs <= 0) show()
    else {
      timerRef.current = window.setTimeout(show, schedule.totalMs)
      // Returning `cur` unchanged bails the re-render out entirely.
      setDisplayed((cur) => (cur.busy ? cur : { ...cur, busy: true }))
    }
  }, [])

  useEffect(() => {
    if (frame === null) {
      queueRef.current = []
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = null
      playingRef.current = false
      shownEventsRef.current = 0
      lastQueuedSeqRef.current = -1
      revisionRef.current += 1
      setDisplayed({ view: null, actions: [], revision: revisionRef.current, busy: false })
      return
    }
    // React may re-run this for the same push; frames are numbered, so a
    // repeat is easy to ignore.
    if (frame.seq <= lastQueuedSeqRef.current) return
    lastQueuedSeqRef.current = frame.seq
    queueRef.current.push(frame)
    play()
  }, [frame, play])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return displayed
}

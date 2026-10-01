import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LegalAction, PlayerView } from 'engine/client'
import { phaseOfStep } from 'engine/client'
import { scheduleEvents } from './animationSchedule.ts'
import type { ScheduledEvent } from './animationSchedule.ts'
import type { AnimationBus } from './animationBus.ts'
import { motionPrefs } from './motionPrefs.ts'

/** One server push: the events since the previous frame, the board they
 * settled into, and what this seat may do once it's shown. */
export interface Frame {
  readonly seq: number
  readonly view: PlayerView
  readonly actions: readonly LegalAction[]
}

export interface Playback {
  readonly view: PlayerView | null
  /** The board shown before `view`, for telling what this frame brought new
   * (the stack's arrivals) — `Table` remounts per frame, so it can't keep
   * that itself. `null` for the first board shown. */
  readonly previousView: PlayerView | null
  readonly actions: readonly LegalAction[]
  /** Bumps once per frame actually shown — for `Table`'s `key`, so its local
   * click-in-progress state resets in step with what the player can see
   * rather than with every push that arrives mid-animation. */
  readonly revision: number
  /** A frame is playing, or one is waiting behind it. Nothing may be clicked
   * while this holds: those actions belong to a board that isn't on screen
   * yet, or one whose changes are still being shown. */
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
 * A frame has a second half, too: animations that describe something only
 * the new board has (a tile tilting to tapped) play over it once it's shown,
 * and the frame isn't finished until they have. Those cues are published from
 * a layout effect, after the new board is in the DOM and before it's painted,
 * so `AnimationLayer` can start them from the old pose without the new one
 * flashing up first.
 *
 * `onShown` fires as each frame finishes, and the caller turns that into the
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
    previousView: null,
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
  /** The second half of the frame just shown, waiting for the layout effect
   * below to publish it against the board that has now mounted. */
  const pendingAfterRef = useRef<{
    readonly view: PlayerView
    readonly prev: PlayerView | null
    readonly items: readonly ScheduledEvent[]
  } | null>(null)
  /** The board on screen when a frame starts playing — the one its first
   * half runs over. Handed to every cue as `prev`, for what only the old
   * board knows (whose a permanent that has since left was). */
  const lastViewRef = useRef<PlayerView | null>(frame?.view ?? null)

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
      lastViewRef.current = skipped.view
      onShownRef.current(skipped.seq)
    }

    const next = queue.shift()
    if (!next) return
    playingRef.current = true
    const prev = lastViewRef.current

    const total = next.view.events.length
    // A reconnect (or a different game entirely) can hand back a shorter log
    // than we've already shown; there's nothing sensible to animate then.
    const from = shownEventsRef.current <= total ? shownEventsRef.current : total
    shownEventsRef.current = total
    const prefs = motionPrefs()
    const schedule = scheduleEvents(next.view.events.slice(from), phaseRef.current, {
      scale: prefs.animScale,
      reduced: prefs.reduced,
    })
    phaseRef.current = schedule.endPhase
    // A hidden tab has nobody watching, and the browser throttles its timers
    // to about one tick a second, so playing the frame out would only hold up
    // the server's bots for nothing. Show it at once instead.
    const watching = document.visibilityState !== 'hidden'
    const beforeMs = watching ? schedule.totalMs : 0
    const afterMs = watching ? schedule.afterMs : 0
    if (watching) {
      busRef.current.publish(
        schedule.items.map((i) => ({
          event: i.event,
          view: next.view,
          prev,
          delay: i.offset,
          half: 'before' as const,
        })),
      )
    }

    const finish = (): void => {
      timerRef.current = null
      playingRef.current = false
      if (afterMs > 0) {
        // The second half is done: the player may act on this board now,
        // unless another frame is already waiting behind it.
        const busy = queueRef.current.length > 0
        setDisplayed((cur) => (cur.busy === busy ? cur : { ...cur, busy }))
      }
      onShownRef.current(next.seq)
      playNext()
    }

    // `totalMs` counts only the animations the game waits for (see
    // animationSchedule's PACED), so a frame carrying nothing but banners
    // lands at once and the banners play over the board that follows it.
    const show = (): void => {
      timerRef.current = null
      revisionRef.current += 1
      lastViewRef.current = next.view
      if (watching && schedule.after.length > 0) {
        pendingAfterRef.current = { view: next.view, prev, items: schedule.after }
      }
      const revision = revisionRef.current
      const busy = afterMs > 0 || queueRef.current.length > 0
      setDisplayed((cur) => ({
        view: next.view,
        previousView: cur.view,
        actions: next.actions,
        revision,
        // Still busy through the second half: the board is on screen, but
        // what's happening to it isn't finished yet.
        busy,
      }))
      if (afterMs > 0) timerRef.current = window.setTimeout(finish, afterMs)
      else finish()
    }

    if (beforeMs <= 0) show()
    else {
      timerRef.current = window.setTimeout(show, beforeMs)
      // Returning `cur` unchanged bails the re-render out entirely.
      setDisplayed((cur) => (cur.busy ? cur : { ...cur, busy: true }))
    }
  }, [])

  // The second half's cues go out once its board has mounted: a layout effect
  // of the component that renders `Table` runs after every tile is in the DOM
  // and before any of it is painted.
  useLayoutEffect(() => {
    const pending = pendingAfterRef.current
    if (pending === null) return
    pendingAfterRef.current = null
    busRef.current.publish(
      pending.items.map((i) => ({
        event: i.event,
        view: pending.view,
        prev: pending.prev,
        delay: i.offset,
        half: 'after' as const,
      })),
    )
  }, [displayed.revision])

  useEffect(() => {
    if (frame === null) {
      queueRef.current = []
      pendingAfterRef.current = null
      lastViewRef.current = null
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = null
      playingRef.current = false
      shownEventsRef.current = 0
      lastQueuedSeqRef.current = -1
      revisionRef.current += 1
      setDisplayed({
        view: null,
        previousView: null,
        actions: [],
        revision: revisionRef.current,
        busy: false,
      })
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

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ObjectId, Phase, PlayerView, PlayerId, TargetRef, VisibleObject } from 'engine'
import { CardTile } from './CardTile.tsx'
import { playerLabel, seatClassOf } from '../format.ts'
import type { SeatClass } from '../format.ts'
import type { SeatStatus } from '../net/protocol.ts'
import { CARD_STEP_MS, PHASE_STEP_MS, TURN_STEP_MS } from '../game/animationSchedule.ts'
import { subscribeAnimations } from '../game/animationQueue.ts'

/** How far an attacker visually lunges toward what it's hitting, in px — a
 * fixed jab distance rather than a fraction of the real gap between the two
 * tiles, so a creature attacking across the whole board doesn't windup
 * absurdly far (see runHit below). */
const LUNGE_DISTANCE_PX = 46
const LUNGE_DURATION_MS = 380
/** Fraction of LUNGE_DURATION_MS at which the lunge reaches its target —
 * matches the lunge keyframes' own `offset: 0.4` peak — so the target's own
 * hit-reaction (runHit's second `.animate()` call) starts right as the
 * attacker actually arrives, not before or after. */
const LUNGE_IMPACT_FRACTION = 0.4
const HIT_REACTION_DURATION_MS = 320
/** Each overlay's visible lifetime *is* the pacing slot its event reserves
 * on the shared timeline (see animationSchedule.ts), so the next scheduled
 * animation picks up right as this one finishes rather than leaving a gap,
 * cutting it off early, or — the banner queue's old failure mode — falling
 * further behind the board with every turn. The matching CSS
 * `animation-duration`s in App.css are written to the same numbers. */
const PLAYED_CARD_DURATION_MS = CARD_STEP_MS
const TURN_BANNER_DURATION_MS = TURN_STEP_MS
const PHASE_BANNER_DURATION_MS = PHASE_STEP_MS

const PHASE_LABEL: Record<Phase, string> = {
  // "beginning" (untap/upkeep/draw) always opens with turn-began, which
  // already gets its own (bigger) banner — a second one half a second later
  // announcing "Beginning Phase" would just be noise, so it's never enqueued
  // (see the `phase === 'beginning'` guard below).
  beginning: '',
  'precombat-main': 'Main Phase',
  combat: 'Combat',
  'postcombat-main': 'Main Phase',
  ending: 'End Phase',
}

interface PlayedCard {
  readonly key: string
  readonly obj: VisibleObject
  readonly fromTop: boolean
}

interface Banner {
  readonly key: string
  readonly kind: 'turn' | 'phase'
  readonly text: string
  readonly seatClass: SeatClass | null
}

/** The DOM node `MiniTile`/`PlayerPanel` render for a combat participant —
 * `data-obj-id` for a creature/planeswalker, `data-player-id` for a player,
 * found via the `TargetRef` discriminant `damage-dealt` itself carries (no
 * "is this actually a player id" guessing needed, unlike the old
 * `attacker-declared`-based version this replaced). */
function elementFor(ref: TargetRef): HTMLElement | null {
  const selector =
    ref.kind === 'object'
      ? `[data-obj-id="${CSS.escape(ref.object)}"]`
      : `[data-player-id="${CSS.escape(ref.player)}"]`
  return document.querySelector<HTMLElement>(selector)
}

/**
 * Punches the source's own battlefield tile a short distance toward what it
 * just hit, and shakes/flashes the thing on the receiving end right as the
 * punch lands — triggered off `damage-dealt` (rather than
 * `attacker-declared`) so it fires at the moment a creature actually
 * connects, not when it's merely declared as attacking, and covers a
 * blocker's damage back at its attacker the same way it covers the
 * attacker's own hit. Found via the `data-obj-id`/`data-player-id`
 * attributes `MiniTile`/`PlayerPanel` render, not by anything React owns,
 * since by the time this runs (an effect, after the state update that
 * produced the event has already committed) there's no "before" tile to
 * animate *from* — see useDelayedView.ts for how `Table` is held back just
 * long enough for this to still be animating the *previous* board picture
 * when it runs, rather than one that already shows the outcome.
 */
function runHit(source: ObjectId, target: TargetRef): void {
  const srcEl = elementFor({ kind: 'object', object: source })
  const targetEl = elementFor(target)
  if (!srcEl || !targetEl) return

  const a = srcEl.getBoundingClientRect()
  const d = targetEl.getBoundingClientRect()
  const dx = d.left + d.width / 2 - (a.left + a.width / 2)
  const dy = d.top + d.height / 2 - (a.top + a.height / 2)
  const dist = Math.hypot(dx, dy) || 1
  const nx = (dx / dist) * LUNGE_DISTANCE_PX
  const ny = (dy / dist) * LUNGE_DISTANCE_PX

  srcEl.animate(
    [
      { transform: 'translate(0, 0) scale(1)', offset: 0 },
      { transform: `translate(${nx}px, ${ny}px) scale(1.08)`, offset: LUNGE_IMPACT_FRACTION },
      { transform: 'translate(0, 0) scale(1)', offset: 1 },
    ],
    { duration: LUNGE_DURATION_MS, easing: 'ease-out' },
  )

  window.setTimeout(() => {
    // Direction-agnostic shake (a fixed left/right wobble, not aimed back
    // along the hit vector) -- simpler than steering it, and reads the same
    // either way since it's over in a fifth of a second.
    targetEl.animate(
      [
        { transform: 'translate(0, 0)', filter: 'brightness(1)', offset: 0 },
        {
          transform: 'translate(-5px, 0)',
          filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(255, 70, 70, 0.85))',
          offset: 0.22,
        },
        { transform: 'translate(4px, 0)', offset: 0.5 },
        { transform: 'translate(-2px, 0)', offset: 0.78 },
        { transform: 'translate(0, 0)', filter: 'brightness(1)', offset: 1 },
      ],
      { duration: HIT_REACTION_DURATION_MS, easing: 'ease-out' },
    )
  }, LUNGE_DURATION_MS * LUNGE_IMPACT_FRACTION)
}

/**
 * Purely cosmetic overlays driven off `view.events` — a card zooming up when
 * cast/played, an attacker hitting whatever it deals combat damage to, and
 * Hearthstone-style turn/phase banners. Deliberately a sibling of `<Table>`
 * in `GameScreen`, not something inside it: `Table` remounts wholesale on
 * every revision it's keyed on, which would tear down every in-flight
 * animation on every single dispatch. It reads the raw `view` (unlike
 * `Table`, which renders `useDelayedView`'s held-back one) — it needs the
 * objects new events reference the instant they exist — but *when* each
 * animation fires comes from the shared queue in `animationQueue.ts`, the
 * same one the board's own hold is computed from.
 *
 * Every visual here is additive (a portalled overlay, or a `.animate()` call
 * on an existing node) — nothing here ever affects `view`/game state, and a
 * missed or double-played animation is harmless.
 */
export function AnimationLayer({
  view,
  seat,
  seats,
}: {
  readonly view: PlayerView
  readonly seat: PlayerId
  readonly seats?: readonly SeatStatus[]
}) {
  const [playedCards, setPlayedCards] = useState<readonly PlayedCard[]>([])
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null)
  const bannerQueueRef = useRef<Banner[]>([])
  const bannerTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (bannerTimerRef.current !== null) window.clearTimeout(bannerTimerRef.current)
    },
    [],
  )

  // Re-subscribed on every `view` so the cue handler below closes over the
  // view the cues were published *from* — `useDelayedView` enqueues in
  // `GameScreen`'s own effect, which React runs after this child one on the
  // same commit, so the fresh closure is always in place first. Looking the
  // object up in a later view instead would miss anything that has since
  // left the zone it was played into.
  useEffect(() => {
    const advanceBannerQueue = () => {
      if (bannerTimerRef.current !== null) return
      const next = bannerQueueRef.current.shift()
      if (!next) return
      setActiveBanner(next)
      bannerTimerRef.current = window.setTimeout(
        () => {
          setActiveBanner(null)
          bannerTimerRef.current = null
          advanceBannerQueue()
        },
        next.kind === 'turn' ? TURN_BANNER_DURATION_MS : PHASE_BANNER_DURATION_MS,
      )
    }
    const enqueueBanner = (b: Banner) => {
      bannerQueueRef.current.push(b)
      advanceBannerQueue()
    }

    // Cues come from the same queue `useDelayedView` holds the board back
    // on (see animationQueue.ts), so every animation plays over the board
    // picture it actually belongs to, and a push arriving mid-sequence
    // queues up behind it instead of landing on top of it.
    // In-flight timers are deliberately *not* cleared on cleanup: this
    // effect re-runs on every push, and a cue already waiting on the
    // timeline belongs to the previous push's board picture, not this one.
    return subscribeAnimations((cues) => {
      for (const { event: ev, delay } of cues) {
        window.setTimeout(() => {
          if (ev.type === 'spell-cast' || ev.type === 'land-played') {
            const obj = view.objects[ev.object]
            if (!obj) return
            const key = `card-${ev.seq}`
            setPlayedCards((cur) => [...cur, { key, obj, fromTop: ev.player !== seat }])
            window.setTimeout(() => {
              setPlayedCards((cur) => cur.filter((c) => c.key !== key))
            }, PLAYED_CARD_DURATION_MS)
          } else if (ev.type === 'damage-dealt' && ev.combat) {
            runHit(ev.source, ev.target)
          } else if (ev.type === 'turn-began') {
            enqueueBanner({
              key: `turn-${ev.seq}`,
              kind: 'turn',
              text: `${playerLabel(ev.activePlayer, seats)}'s Turn${ev.extra ? ' (extra)' : ''}`,
              seatClass: seatClassOf(view.turnOrder, ev.activePlayer),
            })
          } else if (ev.type === 'step-began') {
            const text = PHASE_LABEL[ev.phase]
            if (!text) return
            enqueueBanner({ key: `phase-${ev.seq}`, kind: 'phase', text, seatClass: null })
          }
        }, delay)
      }
    })
  }, [view, seat, seats])

  if (playedCards.length === 0 && !activeBanner) return null

  return createPortal(
    <div className="anim-layer">
      {playedCards.map((c) => (
        <div key={c.key} className={`played-card-fly ${c.fromTop ? 'from-top' : 'from-bottom'}`}>
          <CardTile obj={c.obj} layout="art-first" />
        </div>
      ))}
      {activeBanner ? (
        <div
          key={activeBanner.key}
          className={`tp-banner tp-${activeBanner.kind} ${activeBanner.seatClass ?? ''}`}
        >
          {activeBanner.text}
        </div>
      ) : null}
    </div>,
    document.body,
  )
}

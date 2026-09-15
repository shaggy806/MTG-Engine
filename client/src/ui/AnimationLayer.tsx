import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ObjectId, Phase, PlayerId, PlayerView, VisibleObject } from 'engine'
import { phaseOfStep } from 'engine'
import { CardTile } from './CardTile.tsx'
import { playerLabel, seatClassOf } from '../format.ts'
import type { SeatClass } from '../format.ts'
import type { SeatStatus } from '../net/protocol.ts'

/** How far an attacker visually lunges toward its defender, in px — a fixed
 * jab distance rather than a fraction of the real gap between the two tiles,
 * so a creature attacking across the whole board doesn't windup absurdly far
 * (see runLunge below). */
const LUNGE_DISTANCE_PX = 46
const LUNGE_DURATION_MS = 380
const PLAYED_CARD_DURATION_MS = 1150
const TURN_BANNER_DURATION_MS = 1700
const PHASE_BANNER_DURATION_MS = 1150

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

/** True when `id` names a live object in this view (a planeswalker, say) —
 * combat's `defender` field is a `PlayerId | ObjectId` union with no runtime
 * tag, so this is how `attackTargetLabel` in App.tsx tells them apart too. */
function isObjectId(view: PlayerView, id: PlayerId | ObjectId): boolean {
  return Boolean(view.objects[id as ObjectId])
}

/** Punches the attacker's own battlefield tile a short distance toward its
 * defender and back — found by the `data-obj-id`/`data-player-id` attributes
 * `MiniTile`/`PlayerPanel` render, not by anything React owns, since by the
 * time this runs (an effect, after the state update that produced the
 * `attacker-declared` event has already committed) there's no "before" tile
 * to animate *from*: `Table` remounts wholesale on every revision (see its
 * `key={game.revision}` in App.tsx), so a FLIP-style tween isn't available
 * here — only a self-relative jab is.
 */
function runLunge(view: PlayerView, attacker: ObjectId, defender: PlayerId | ObjectId): void {
  const atkEl = document.querySelector<HTMLElement>(
    `[data-obj-id="${CSS.escape(attacker)}"]`,
  )
  if (!atkEl) return
  const defSelector = isObjectId(view, defender)
    ? `[data-obj-id="${CSS.escape(defender)}"]`
    : `[data-player-id="${CSS.escape(defender)}"]`
  const defEl = document.querySelector<HTMLElement>(defSelector)
  if (!defEl) return

  const a = atkEl.getBoundingClientRect()
  const d = defEl.getBoundingClientRect()
  const dx = d.left + d.width / 2 - (a.left + a.width / 2)
  const dy = d.top + d.height / 2 - (a.top + a.height / 2)
  const dist = Math.hypot(dx, dy) || 1
  const nx = (dx / dist) * LUNGE_DISTANCE_PX
  const ny = (dy / dist) * LUNGE_DISTANCE_PX

  atkEl.animate(
    [
      { transform: 'translate(0, 0) scale(1)', offset: 0 },
      { transform: `translate(${nx}px, ${ny}px) scale(1.08)`, offset: 0.4 },
      { transform: 'translate(0, 0) scale(1)', offset: 1 },
    ],
    { duration: LUNGE_DURATION_MS, easing: 'ease-out' },
  )
}

/**
 * Purely cosmetic overlays driven off `view.events` — a card zooming up when
 * cast/played, an attacker jabbing toward its target, and Hearthstone-style
 * turn/phase banners. Deliberately a sibling of `<Table>` in `GameScreen`,
 * not something inside it: `Table` remounts wholesale on every revision (see
 * its `key={game.revision}`), which would reset the "which events have I
 * already animated" bookkeeping below on every single dispatch.
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
  // Starts at the current length, not 0 — a fresh mount (joining a game
  // already in progress) must never replay its entire history.
  const prevLenRef = useRef(view.events.length)
  const lastPhaseRef = useRef<Phase>(phaseOfStep(view.turn.step))
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

  useEffect(() => {
    const from = prevLenRef.current
    const events = view.events
    prevLenRef.current = events.length
    if (from >= events.length) return

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

    for (const ev of events.slice(from)) {
      if (ev.type === 'spell-cast' || ev.type === 'land-played') {
        const obj = view.objects[ev.object]
        if (!obj) continue
        const key = `card-${ev.seq}`
        setPlayedCards((cur) => [...cur, { key, obj, fromTop: ev.player !== seat }])
        window.setTimeout(() => {
          setPlayedCards((cur) => cur.filter((c) => c.key !== key))
        }, PLAYED_CARD_DURATION_MS)
      } else if (ev.type === 'attacker-declared') {
        runLunge(view, ev.attacker, ev.defender)
      } else if (ev.type === 'turn-began') {
        lastPhaseRef.current = 'beginning'
        enqueueBanner({
          key: `turn-${ev.seq}`,
          kind: 'turn',
          text: `${playerLabel(ev.activePlayer, seats)}'s Turn${ev.extra ? ' (extra)' : ''}`,
          seatClass: seatClassOf(view.turnOrder, ev.activePlayer),
        })
      } else if (ev.type === 'step-began') {
        if (ev.phase === lastPhaseRef.current) continue
        lastPhaseRef.current = ev.phase
        const text = PHASE_LABEL[ev.phase]
        if (!text) continue
        enqueueBanner({ key: `phase-${ev.seq}`, kind: 'phase', text, seatClass: null })
      }
    }
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

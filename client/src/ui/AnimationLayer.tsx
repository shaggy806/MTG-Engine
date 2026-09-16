import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type {
  GameEvent,
  ObjectId,
  Phase,
  PlayerId,
  PlayerView,
  TargetRef,
  VisibleObject,
} from 'engine'
import { CardTile } from './CardTile.tsx'
import { playerLabel, seatClassOf } from '../format.ts'
import type { SeatClass } from '../format.ts'
import type { SeatStatus } from '../net/protocol.ts'
import { CARD_STEP_MS, PHASE_STEP_MS, TURN_STEP_MS } from '../game/animationSchedule.ts'
import type { AnimationBus } from '../game/animationBus.ts'

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
/** Each overlay's visible lifetime *is* the slot its event reserves inside
 * the frame (see animationSchedule.ts), so the next animation picks up right
 * as this one finishes rather than leaving a gap or cutting it off early.
 * The matching CSS `animation-duration`s in App.css are written to the same
 * numbers. */
const PLAYED_CARD_DURATION_MS = CARD_STEP_MS
const TURN_BANNER_DURATION_MS = TURN_STEP_MS
const PHASE_BANNER_DURATION_MS = PHASE_STEP_MS

/** How far the banner queue may fall behind the game before it starts
 * dropping the oldest. */
const MAX_QUEUED_BANNERS = 3

const PHASE_LABEL: Record<Phase, string> = {
  // "beginning" (untap/upkeep/draw) always opens with turn-began, which
  // already gets its own (bigger) banner — a second one half a second later
  // announcing "Beginning Phase" would just be noise, so it's never enqueued
  // (see the `phase === 'beginning'` guard in animationSchedule).
  beginning: '',
  'precombat-main': 'Main Phase',
  combat: 'Combat',
  'postcombat-main': 'Main Phase',
  ending: 'End Phase',
}

interface PlayedCard {
  readonly key: string
  readonly obj: VisibleObject
  /** Where the card flies in from, as an offset in px from the centre of the
   * viewport to the centre of its owner's cell in the table grid — so a card
   * comes off the side of the screen belonging to whoever played it. Fed to
   * the CSS keyframes as `--fly-x`/`--fly-y`. */
  readonly originX: number
  readonly originY: number
}

/** The centre of `player`'s cell in the table grid, relative to the centre of
 * the viewport. Measured off the live DOM rather than derived from the seat
 * layout, so the 2-player (stacked) and 3-4 player (2x2) grids both work
 * without this knowing which is on screen. Falls back to straight up from the
 * bottom (your own cards) or down from the top (everyone else's) if the cell
 * can't be found — mid-remount, say. */
function flyOrigin(player: PlayerId, seat: PlayerId): { x: number; y: number } {
  const panel = document.querySelector<HTMLElement>(
    `[data-player-id="${CSS.escape(player)}"]`,
  )
  const cell = panel?.closest<HTMLElement>('.quadrant-cell') ?? panel
  if (!cell) return { x: 0, y: player === seat ? window.innerHeight * 0.45 : -window.innerHeight * 0.45 }
  const r = cell.getBoundingClientRect()
  return {
    x: r.left + r.width / 2 - window.innerWidth / 2,
    y: r.top + r.height / 2 - window.innerHeight / 2,
  }
}

interface Banner {
  readonly key: string
  readonly kind: 'turn' | 'phase'
  readonly text: string
  readonly seatClass: SeatClass | null
}

/** The DOM node `MiniTile`/`PlayerPanel` render for a combat participant —
 * `data-obj-id` for a creature/planeswalker, `data-player-id` for a player,
 * found via the `TargetRef` discriminant `damage-dealt` itself carries. */
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
 * attributes `MiniTile`/`PlayerPanel` render, not by anything React owns:
 * this fires while the board on screen is still the one from *before* the
 * frame being played, which is exactly the "before" picture the punch needs
 * to start from (see usePlayback.ts).
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
 * Purely cosmetic overlays — a card zooming up when cast or played, an
 * attacker hitting whatever it deals combat damage to, and Hearthstone-style
 * turn/phase banners.
 *
 * Deliberately a sibling of `<Table>` in `GameScreen`, not something inside
 * it: `Table` remounts wholesale on every frame it's keyed on, which would
 * tear down every in-flight animation. Its cues come from the bus
 * `usePlayback` publishes to as it plays each frame, and each cue carries
 * the board it belongs to — so the card drawn here is the card as it looked
 * in that frame, not as it looks in whatever the server has pushed since.
 *
 * Every visual here is additive (a portalled overlay, or a `.animate()` call
 * on an existing node) — nothing here ever affects game state, and a missed
 * or double-played animation is harmless.
 */
export function AnimationLayer({
  bus,
  seat,
  seats,
}: {
  readonly bus: AnimationBus
  readonly seat: PlayerId
  readonly seats?: readonly SeatStatus[]
}) {
  const [playedCards, setPlayedCards] = useState<readonly PlayedCard[]>([])
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null)
  const bannerQueueRef = useRef<Banner[]>([])
  const bannerTimerRef = useRef<number | null>(null)

  // Read through refs, so the one subscription below survives every push
  // instead of being torn down and rebuilt (which would drop cues already
  // waiting on their own timers).
  const seatRef = useRef(seat)
  const seatsRef = useRef(seats)
  useEffect(() => {
    seatRef.current = seat
    seatsRef.current = seats
  }, [seat, seats])

  useEffect(
    () => () => {
      if (bannerTimerRef.current !== null) window.clearTimeout(bannerTimerRef.current)
    },
    [],
  )

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
      // Banners are captions: they hold nothing up (see animationSchedule's
      // PACED), which means the game can outrun this queue. Keep only the
      // most recent few, so a backlog gets dropped rather than narrating a
      // turn that finished several turns ago.
      if (bannerQueueRef.current.length > MAX_QUEUED_BANNERS) {
        bannerQueueRef.current.splice(0, bannerQueueRef.current.length - MAX_QUEUED_BANNERS)
      }
      advanceBannerQueue()
    }

    const fire = (ev: GameEvent, view: PlayerView): void => {
      if (ev.type === 'spell-cast' || ev.type === 'land-played') {
        const obj = view.objects[ev.object]
        if (!obj) return
        const key = `card-${ev.seq}`
        const origin = flyOrigin(ev.player, seatRef.current)
        setPlayedCards((cur) => [...cur, { key, obj, originX: origin.x, originY: origin.y }])
        window.setTimeout(() => {
          setPlayedCards((cur) => cur.filter((c) => c.key !== key))
        }, PLAYED_CARD_DURATION_MS)
      } else if (ev.type === 'damage-dealt' && ev.combat) {
        runHit(ev.source, ev.target)
      } else if (ev.type === 'turn-began') {
        enqueueBanner({
          key: `turn-${ev.seq}`,
          kind: 'turn',
          text: `${playerLabel(ev.activePlayer, seatsRef.current)}'s Turn${ev.extra ? ' (extra)' : ''}`,
          seatClass: seatClassOf(view.turnOrder, ev.activePlayer),
        })
      } else if (ev.type === 'step-began') {
        const text = PHASE_LABEL[ev.phase]
        if (!text) return
        enqueueBanner({ key: `phase-${ev.seq}`, kind: 'phase', text, seatClass: null })
      }
    }

    return bus.subscribe((cues) => {
      for (const cue of cues) {
        window.setTimeout(() => fire(cue.event, cue.view), cue.delay)
      }
    })
  }, [bus])

  if (playedCards.length === 0 && !activeBanner) return null

  return createPortal(
    <div className="anim-layer">
      {playedCards.map((c) => (
        <div
          key={c.key}
          className="played-card-fly"
          style={
            { '--fly-x': `${c.originX}px`, '--fly-y': `${c.originY}px` } as CSSProperties
          }
        >
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

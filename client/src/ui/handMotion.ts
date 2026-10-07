/**
 * Cards moving into and out of the viewer's own hand (the user, 2026-10-07):
 * a card played lifts out of its own place in the fan, a card drawn turns
 * over off the library and settles into its place, and the rest of the fan
 * glides to its new spacing rather than jumping when `Table` remounts.
 *
 * A hand card is two boxes (App.css's `.hand-cards .hand-card`): the
 * `.hand-card` hitbox, never transformed, and its `.card-tile`, fanned by
 * the `rotate`/`translate`/`scale` properties about its bottom centre. So a
 * tile's pose is its layout box (offsets in the hitbox, which nothing
 * transforms) and those three properties, and where it is on screen is
 * worked out from them rather than from its rotated bounding box.
 */
import type { ObjectId } from 'engine/client'

/** A hand tile as it stands: its untransformed layout box in viewport px,
 * and the fan's rotation (deg), offset (px) and scale on top, about the
 * box's bottom centre. */
interface TilePose {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly rotate: number
  readonly tx: number
  readonly ty: number
  readonly scale: number
}

function px(value: string | undefined): number {
  const n = Number.parseFloat(value ?? '')
  return Number.isFinite(n) ? n : 0
}

/** `tile`'s pose as the browser has it right now — mid-transition included,
 * so a card grown under the pointer is taken as grown. */
function poseOf(handCard: HTMLElement, tile: HTMLElement): TilePose {
  const box = handCard.getBoundingClientRect()
  const style = getComputedStyle(tile)
  const [tx, ty] = style.translate === 'none' ? [] : style.translate.split(' ')
  return {
    left: box.left + tile.offsetLeft,
    top: box.top + tile.offsetTop,
    width: tile.offsetWidth,
    height: tile.offsetHeight,
    rotate: style.rotate === 'none' ? 0 : px(style.rotate),
    tx: px(tx),
    ty: px(ty),
    scale: style.scale === 'none' ? 1 : px(style.scale),
  }
}

/** `(x, y)` turned `deg` clockwise on screen (y down), as CSS `rotate` does. */
function turn(x: number, y: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) }
}

/** Where a pose's tile is drawn: its centre in viewport px, its drawn width
 * and its rotation. */
function drawnAt(pose: TilePose): { x: number; y: number; width: number; rotate: number } {
  const lift = turn(0, (-pose.scale * pose.height) / 2, pose.rotate)
  return {
    x: pose.left + pose.width / 2 + pose.tx + lift.x,
    y: pose.top + pose.height + pose.ty + lift.y,
    width: pose.width * pose.scale,
    rotate: pose.rotate,
  }
}

/** The viewer's own hand card for `object`, in the fan (not the grid, which
 * has no fan to fly into). */
export function handCardOf(object: ObjectId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.hand-cards .hand-card[data-obj-id="${CSS.escape(object)}"]`)
}

/** Where a card being played stands in the hand, to lift the spotlight out
 * of — measured as the cue fires, over the board the play started from,
 * which is about to go — and the hand card hidden, since its copy now flies.
 * `null` when it isn't in the viewer's fan. */
export function liftFromHand(object: ObjectId): { x: number; y: number; width: number; rotate: number } | null {
  const handCard = handCardOf(object)
  const tile = handCard?.querySelector<HTMLElement>('.card-tile')
  if (!handCard || !tile || tile.offsetWidth === 0) return null
  const at = drawnAt(poseOf(handCard, tile))
  handCard.style.visibility = 'hidden'
  return at
}

/**
 * The start pose of a spotlight lifted out of the hand (`.from-hand`): the
 * transform that puts the spotlight's own card exactly where the hand card
 * was drawn, as `--hand-dx`/`--hand-dy`/`--hand-r`/`--hand-s` for App.css's
 * `played-card-from-hand` keyframes. Measured on the spotlight with its
 * animation off (its resting place — `translate`, which places a rising
 * card beside the stack, included), before it paints.
 */
export function placeLiftedSpotlight(
  spotlight: HTMLElement,
  from: { x: number; y: number; width: number; rotate: number },
): void {
  const card = spotlight.querySelector<HTMLElement>('.card-tile')
  if (card === null) return
  const animation = spotlight.style.animation
  spotlight.style.animation = 'none'
  const e = spotlight.getBoundingClientRect()
  const c = card.getBoundingClientRect()
  spotlight.style.animation = animation
  if (c.width === 0) return
  // The keyframes turn and scale the spotlight about its own centre: find
  // the shift that then lands its card's centre on the hand card's.
  const ex = e.left + e.width / 2
  const ey = e.top + e.height / 2
  const s = from.width / c.width
  const off = turn((c.left + c.width / 2 - ex) * s, (c.top + c.height / 2 - ey) * s, from.rotate)
  spotlight.style.setProperty('--hand-dx', `${from.x - ex - off.x}px`)
  spotlight.style.setProperty('--hand-dy', `${from.y - ey - off.y}px`)
  spotlight.style.setProperty('--hand-r', `${from.rotate}deg`)
  spotlight.style.setProperty('--hand-s', String(s))
}

/** `cubic-bezier(0.3, 0, 0.3, 1)` — slow off the pile, slow into the hand —
 * at time fraction `t`: the curve's parameter for that `x` found by
 * Newton's method, then its `y`. */
function ease(t: number): number {
  // x(u) = 0.9·u(1−u)² + 0.9·u²(1−u) + u³, y(u) = 3u²(1−u) + u³.
  const x = (u: number) => 0.9 * u * (1 - u) ** 2 + 0.9 * u * u * (1 - u) + u ** 3
  const dx = (u: number) => 0.9 * (1 - u) ** 2 + 2.1 * u * u
  let u = t
  for (let i = 0; i < 8; i += 1) u = Math.min(1, Math.max(0, u - (x(u) - t) / dx(u)))
  return 3 * u * u * (1 - u) + u ** 3
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/**
 * A card drawn into the viewer's hand, flown in over the new board: the hand
 * card is held hidden (`data-arriving`, which App.css hides and React never
 * writes), and a copy leaves the library pile `pile` as a cardback, turns
 * face up on the way, and settles into the card's own pose in the fan, after
 * `delay` ms; then the card shows. A pile showing its top card face up
 * (Oracle of Mul Daya) was already face up, so it doesn't turn.
 *
 * The copy is steered frame by frame (`requestAnimationFrame`) rather than
 * given fixed keyframes, re-measuring the card's place each time: the hand
 * moves under it — the peek tray rising or falling, the fan opening up for
 * it — and a flight aimed where the place was when it set off landed beside
 * it. Hidden at once, in the task that mounted the board; the copy is made
 * at the next frame, still before that board paints, once the hand's
 * spacing (a layout effect of its own) has settled.
 */
export function flyIntoHand(
  object: ObjectId,
  pile: HTMLElement | null,
  seat: string,
  delay: number,
  duration: number,
): void {
  const first = handCardOf(object)
  if (first === null || pile === null) return
  first.dataset.arriving = ''
  const started = performance.now()
  const show = (): void => {
    delete first.dataset.arriving
    const now = handCardOf(object)
    if (now) delete now.dataset.arriving
  }
  requestAnimationFrame(() => {
    const handCard = handCardOf(object)
    const tile = handCard?.querySelector<HTMLElement>('.card-tile')
    const from = pile.getBoundingClientRect()
    if (!handCard || !tile || tile.offsetWidth === 0 || from.width === 0) {
      show()
      return
    }
    const faceUp = pile.classList.contains('card-tile')
    const box = document.createElement('div')
    box.className = 'ghost-flight hand-draw-ghost'
    // Which card it's flying in, for anyone looking (the e2e spec).
    box.dataset.for = object
    const flipper = document.createElement('div')
    flipper.className = 'hand-draw-flipper'
    const face = tile.cloneNode(true) as HTMLElement
    face.classList.add('hand-draw-face')
    flipper.appendChild(face)
    if (!faceUp) {
      const back = document.createElement('div')
      back.className = 'hand-draw-back seat-tinted'
      back.style.setProperty('--seat', seat)
      back.appendChild(document.createElement('div')).className = 'card-back'
      flipper.appendChild(back)
    }
    box.appendChild(flipper)
    document.body.appendChild(box)

    let last = poseOf(handCard, tile)
    const step = (now: number): boolean => {
      const elapsed = now - started - delay
      const t = Math.min(1, Math.max(0, elapsed / duration))
      // Where the card's place is now; its last known one if it has gone.
      const card = handCardOf(object)
      const cardTile = card?.querySelector<HTMLElement>('.card-tile')
      if (card && cardTile && cardTile.offsetWidth > 0) last = poseOf(card, cardTile)
      const pose = last
      Object.assign(box.style, {
        left: `${pose.left}px`,
        top: `${pose.top}px`,
        width: `${pose.width}px`,
        height: `${pose.height}px`,
      })
      box.style.setProperty('--card-w', `${pose.width}px`)
      // About the box's bottom centre, as the fan turns its tiles: the start
      // puts the copy's centre on the pile's, at the pile card's size.
      const s0 = from.width / pose.width
      const x0 = from.left + from.width / 2 - (pose.left + pose.width / 2)
      const y0 = from.top + from.height / 2 - (pose.top + pose.height) + (s0 * pose.height) / 2
      const e = ease(t)
      // A touch big on the way in, settling to the card's size.
      const swell = Math.sin(Math.PI * Math.min(1, t / 0.9)) * 0.06
      box.style.transform =
        `translate(${lerp(x0, pose.tx, e)}px, ${lerp(y0, pose.ty, e)}px) ` +
        `rotate(${lerp(0, pose.rotate, e)}deg) scale(${lerp(s0, pose.scale, e) + swell})`
      box.style.opacity = elapsed < 0 ? '0' : String(Math.min(1, t / 0.08))
      if (!faceUp) {
        // Face down off the pile, turning over through the middle of the flight.
        const turnT = Math.min(1, Math.max(0, (t - 0.15) / 0.5))
        flipper.style.transform = `rotateY(${180 * (1 - (1 - Math.cos(Math.PI * turnT)) / 2)}deg)`
      }
      return t < 1
    }
    const frame = (now: number): void => {
      if (step(now)) requestAnimationFrame(frame)
      else {
        box.remove()
        show()
      }
    }
    step(performance.now())
    requestAnimationFrame(frame)
  })
}

/** Each hand card's place in the fan as it was last shown, relative to the
 * hand row (so the peek tray rising or falling isn't a move), for the next
 * board's cards to glide from. */
type Place = { readonly x: number; readonly y: number; readonly r: string; readonly ty: string }
const lastPlaces = new Map<ObjectId, Place>()

/** Where the hand's cards stood on the board shown before this one: taken
 * once as a board mounts, before its own layout passes record over it. */
export function handPlacesBefore(): ReadonlyMap<ObjectId, Place> {
  return new Map(lastPlaces)
}

function placesIn(row: HTMLElement): Map<ObjectId, { el: HTMLElement; x: number; y: number; r: string; ty: string }> {
  const r = row.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const places = new Map<ObjectId, { el: HTMLElement; x: number; y: number; r: string; ty: string }>()
  for (const el of row.querySelectorAll<HTMLElement>('.hand-card[data-obj-id]')) {
    // The ids the hand rendered, as the board's own (`ObjectId` is a brand).
    const id = el.dataset.objId as ObjectId | undefined
    if (id === undefined) continue
    const b = el.getBoundingClientRect()
    places.set(id, {
      el,
      x: b.left + b.width / 2 - cx,
      y: b.top - r.top,
      r: el.style.getPropertyValue('--r') || '0deg',
      ty: el.style.getPropertyValue('--y') || '0px',
    })
  }
  return places
}

/** How long the fan takes to close up round a card played, or open up for
 * one drawn, when the next board is shown. Not a slot: the new board is
 * already the outcome, and this only eases into it. */
const SLIDE_MS = 320

/**
 * The hand row of a board just mounted (`Table` remounts per frame): each
 * card that was in the hand on the board before (`before`, from
 * {@link handPlacesBefore}) glides from where it stood to its new place and
 * angle, so the fan closes round a card played and opens for one drawn
 * instead of jumping. `before` null only records where the cards are — a
 * re-layout of the board already shown (a resize) isn't a change of hand.
 * Returns what cancels the glides, for a re-layout before they've painted
 * (the spacing settling), which glides again from the same `before`.
 */
export function slideHand(row: HTMLElement, before: ReadonlyMap<ObjectId, Place> | null, scale: number): () => void {
  const now = placesIn(row)
  const running: Animation[] = []
  if (before !== null && scale > 0) {
    const duration = SLIDE_MS * scale
    const timing: KeyframeAnimationOptions = { duration, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    for (const [id, at] of now) {
      const was = before.get(id)
      if (was === undefined) continue
      const dx = was.x - at.x
      const dy = was.y - at.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        running.push(at.el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], timing))
      }
      // The fan's angle and droop change with the hand's size too. Not on a
      // card grown under the pointer, whose own pose isn't the fan's.
      const tile = at.el.querySelector<HTMLElement>('.card-tile')
      const grown = at.el.matches(':hover') || at.el.classList.contains('hover-carry')
      if (tile && !grown && (was.r !== at.r || was.ty !== at.ty)) {
        running.push(
          tile.animate(
            [
              { rotate: was.r, translate: `0 ${was.ty}` },
              { rotate: at.r, translate: `0 ${at.ty}` },
            ],
            timing,
          ),
        )
      }
    }
  }
  lastPlaces.clear()
  for (const [id, at] of now) lastPlaces.set(id, { x: at.x, y: at.y, r: at.r, ty: at.ty })
  return () => {
    for (const a of running) a.cancel()
  }
}

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { VisibleObject } from 'engine'
import { CardTile } from './CardTile.tsx'
import { costColor } from './symbols.ts'
import { manaSymbolUrl } from './mana.ts'
import {
  isArtBlocked,
  isArtPending,
  getArtCacheVersion,
  queueArtLookup,
  recordArtFailure,
  resolveArtUrl,
  subscribeArtCache,
} from './art.ts'

const TAP_ICON_URL = manaSymbolUrl('T')

/** Breathing room between the tile and its popover, and between the popover
 * and the viewport edge it gets clamped against. */
const POPOVER_GAP = 6

export interface MiniTileProps {
  readonly obj: VisibleObject
  readonly highlight?: boolean
  readonly selected?: boolean
  readonly dimmed?: boolean
  readonly activatable?: boolean
  readonly badge?: string | null
  readonly extraGenericCost?: number
  readonly order?: number | null
  readonly stackCount?: number | null
  readonly onClick?: () => void
}

/** A single glyph per keyword, shown as a small dot stack on the tile itself
 * — the full word is still in the hover/focus popover's keyword line
 * (`CardTile`'s own rendering), this is just enough to recognize at a
 * glance which keywords a permanent has without reading it. */
const KEYWORD_ICON: Record<string, string> = {
  flying: '✈',
  trample: '▲',
  deathtouch: '☠',
  lifelink: '♥',
  menace: '⚔',
  vigilance: '◎',
  haste: '⚡',
  reach: '↟',
  'first-strike': '1',
  'double-strike': '2',
  indestructible: '◆',
  hexproof: '⛨',
  flash: '✦',
  defender: '⛔',
}

/**
 * A battlefield permanent reduced to its image and a stat badge — no name,
 * cost, type line, or rules text, which is what made the board cluttered at
 * a glance. Hovering (or focusing, for keyboard/touch) reveals the full
 * `CardTile` in a popover anchored to the tile itself. Everywhere else a
 * card needs to be read directly (hand, the stack, command zone/library) —
 * that's still `CardTile`, unchanged; this is battlefield-only (see
 * `tileFor`'s `mini` option in `App.tsx`).
 *
 * The popover is portalled to `document.body` and placed from JS, rather
 * than being an absolutely-positioned child revealed by a CSS `:hover` rule
 * as it originally was. It has to be: the tile lives inside `.quadrant-body`,
 * which is `overflow-y: auto` and therefore *clips* every descendant — a
 * popover big enough to read was sliced off at the quadrant's edge, and no
 * amount of z-index fixes that (`.quadrant-cell` avoiding `overflow: hidden`
 * only ever helped for the frame, not for the scroll box inside it). Nor can
 * a fixed-position child escape, now that `.quadrant-body` is a size
 * container: `contain: layout` makes it the containing block for fixed
 * descendants too. Leaving the DOM subtree entirely is the only way out, and
 * once placement is in JS it can also flip above the tile instead of below
 * when the tile is near the bottom of the screen, which the CSS version
 * couldn't do either.
 */
export function MiniTile({
  obj,
  highlight = false,
  selected = false,
  dimmed = false,
  activatable = false,
  badge = null,
  extraGenericCost = 0,
  order = null,
  stackCount = null,
  onClick,
}: MiniTileProps) {
  const face = obj.copyOf ?? obj.faceName ?? obj.cardName
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)
  // Queued synchronously during render — see the comment in CardTile.tsx.
  if (!obj.art) queueArtLookup(face)
  const pending = !obj.art && isArtPending(face)
  const artSrc = resolveArtUrl(obj.art, face)
  const artFailed = !pending && isArtBlocked(artSrc)
  const isCreature = obj.power !== null && obj.toughness !== null
  const isPlaneswalker = obj.loyalty !== null
  const clickable = Boolean(onClick) && (highlight || selected || activatable)
  const tint = costColor(obj.manaCost) ?? 'C'

  const wrapRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // Placement is written straight to the node rather than held in state: the
  // popover's own size depends on how much rules text the card has, so where
  // it goes can only be decided *after* it has rendered, and feeding that
  // measurement back through state would just re-render to produce the same
  // markup with two numbers changed. It renders `visibility: hidden` for that
  // one layout pass (the `placed` class below turns it on), which is also
  // what gives the opacity transition something to start from.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = wrapRef.current
      const popover = popoverRef.current
      if (!anchor || !popover) return
      const a = anchor.getBoundingClientRect()
      const p = popover.getBoundingClientRect()
      // Below the tile by preference (the board area below a tile, or the
      // collapsed hand tray under your own board, usually has the most
      // slack); above it when that would run off the bottom of the screen,
      // which is every tile in a bottom-row quadrant once the popover is
      // tall enough to matter; and pinned inside the viewport if neither
      // side fits, since a clipped popover is the thing being fixed here.
      const below = a.bottom + POPOVER_GAP
      const above = a.top - POPOVER_GAP - p.height
      const top =
        below + p.height <= window.innerHeight
          ? below
          : above >= 0
            ? above
            : Math.max(POPOVER_GAP, window.innerHeight - p.height - POPOVER_GAP)
      const left = Math.min(
        Math.max(POPOVER_GAP, a.left),
        Math.max(POPOVER_GAP, window.innerWidth - p.width - POPOVER_GAP),
      )
      popover.style.left = `${left}px`
      popover.style.top = `${top}px`
      popover.classList.add('placed')
    }
    place()
    // The anchor moves under a popover that's already open whenever a
    // quadrant scrolls or the window resizes — capture so a scroll on any
    // of the nested scroll boxes between the tile and the page counts.
    window.addEventListener('scroll', place, { capture: true, passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, { capture: true })
      window.removeEventListener('resize', place)
    }
    // `obj` too: a pushed view can change the card's rules text (and so the
    // popover's height) while it's open, which is a reason to re-place it.
  }, [open, obj])

  const classes = [
    'mini-tile',
    obj.tapped ? 'tapped' : '',
    highlight ? 'highlight' : '',
    selected ? 'selected' : '',
    activatable ? 'activatable' : '',
    dimmed ? 'dimmed' : '',
    clickable ? 'clickable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className="mini-tile-wrap"
      ref={wrapRef}
      // Read by AnimationLayer to find this tile's DOM node for an attack
      // lunge — not used for anything React-owned.
      data-obj-id={obj.id}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      // Keyboard/touch parity, standing in for the `:focus-within` the CSS
      // rule used to get for free — React's onFocus/onBlur bubble, so the
      // tile button inside is what actually fires these.
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className={classes}
        onClick={clickable ? onClick : undefined}
        disabled={!clickable}
      >
        <span className={`mt-art tint-${tint}`}>
          {!pending && !artFailed ? (
            <img
              src={artSrc}
              alt=""
              loading="lazy"
              onError={() => recordArtFailure(artSrc)}
            />
          ) : null}
        </span>

        {obj.keywords.length > 0 ? (
          <span className="mt-kw">
            {obj.keywords.map((k) => (
              <span key={k}>{KEYWORD_ICON[k] ?? '•'}</span>
            ))}
          </span>
        ) : null}

        {isCreature ? (
          <span className="ct-pt">
            {obj.power}/{obj.toughness}
            {obj.damageMarked > 0 ? <span className="ct-dmg"> −{obj.damageMarked}</span> : null}
          </span>
        ) : null}
        {isPlaneswalker ? (
          <span className="ct-loyalty" title="Loyalty">
            {obj.loyalty}
          </span>
        ) : null}

        {order !== null ? <span className="card-order">{order}</span> : null}
        {stackCount !== null && stackCount > 1 ? (
          <span className="card-stack">×{stackCount}</span>
        ) : null}
        {obj.summoningSick && isCreature ? <span className="card-flag sick">Z</span> : null}
        {badge ? <span className="mt-badge">{badge}</span> : null}
        {obj.tapped && TAP_ICON_URL ? (
          <img className="tap-icon" src={TAP_ICON_URL} alt="" />
        ) : null}
      </button>

      {open
        ? createPortal(
            <div className="mini-tile-popover" ref={popoverRef}>
              <CardTile obj={obj} extraGenericCost={extraGenericCost} badge={badge} />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

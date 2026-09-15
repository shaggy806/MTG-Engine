import { createPortal } from 'react-dom'
import type { CardDefinition } from 'engine'
import { CardTile } from './CardTile.tsx'
import { defToVisible } from './defToVisible.ts'

/** The preview's box — must match `--card-w` and the tile's 1.4 aspect in
 * `.card-hover-preview` (deck-builder.css); used to keep it on screen. */
const PREVIEW_W = 220
const PREVIEW_H = 310
const GAP = 14

export interface HoverTarget {
  readonly def: CardDefinition
  /** Where the pointer was, in viewport coordinates. */
  readonly x: number
  readonly y: number
}

/**
 * The floating card preview the deck builder shows while the pointer is over
 * a card name.
 *
 * Portalled to `document.body` and placed from JS rather than being an
 * absolutely-positioned child revealed on `:hover`, for the same reason
 * `MiniTile`'s board popover is: the lists it hangs off are scroll boxes, so
 * a child would be clipped by `overflow`. Placed beside the pointer, flipped
 * to the other side when it would run off the right edge, and clamped
 * vertically so it never hangs off the top or bottom.
 */
export function CardHoverPreview({ target }: { readonly target: HoverTarget | null }) {
  if (target === null) return null

  const flipLeft = target.x + GAP + PREVIEW_W > window.innerWidth
  const left = flipLeft ? Math.max(GAP, target.x - GAP - PREVIEW_W) : target.x + GAP
  const top = Math.min(
    Math.max(GAP, target.y - PREVIEW_H / 2),
    Math.max(GAP, window.innerHeight - PREVIEW_H - GAP),
  )

  return createPortal(
    <div className="card-hover-preview" style={{ left, top }} aria-hidden="true">
      <CardTile obj={defToVisible(target.def)} />
    </div>,
    document.body,
  )
}

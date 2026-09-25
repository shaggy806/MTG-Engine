import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { VisibleObject } from 'engine/client'
import { CardTile } from './CardTile.tsx'
import { Symbols } from './Symbols.tsx'
import { useHoverPopover } from './useHoverPopover.ts'
import { cardTint } from './symbols.ts'
import {
  isArtBlocked,
  isArtPending,
  getArtCacheVersion,
  queueArtLookup,
  recordArtFailure,
  resolveArtUrl,
  subscribeArtCache,
} from './art.ts'

export interface CommanderTileProps {
  readonly obj: VisibleObject
  /** Castable from the command zone right now — same highlight/click
   * treatment a castable hand card gets. */
  readonly highlight?: boolean
  /** Extra generic mana beyond the printed cost (the commander tax, rule
   * 903.4) — shown as a separate `+N` next to the pips, not folded into
   * them, so the printed cost stays legible. */
  readonly extraGenericCost?: number
  readonly onClick?: () => void
  /** One of two Partners sharing the command slot: the same tile with a
   * shorter art box, so both fit — see `.command-stack` in App.css. */
  readonly paired?: boolean
}

/**
 * A commander in the command zone reduced to its art and the one thing worth
 * knowing at a glance, its mana cost (tax included), with the full
 * `CardTile` on hover: the same trade `MiniTile` makes for the battlefield.
 * The command/library rail is the narrowest column on the board and is
 * height-capped against its quadrant (see `--card-w` in App.css), so a full
 * card face there was both the least readable card on screen and the one
 * taking the most room from the board.
 *
 * Name and P/T went too, and are on the hover card. The name, clamped into a
 * rail a few pips wide, was rarely readable, and the two together were
 * enough to overflow the rail on a short screen. Worse, they left no room
 * for a second commander's art: two Partners had to share one tile, the back
 * one reduced to a banner that read more like a rendering glitch than a
 * commander. Without them, each Partner gets a tile of its own.
 *
 * The popover is portalled and JS-placed via `useHoverPopover` — see there
 * for why a CSS-revealed child can't escape the quadrant's scroll box.
 */
export function CommanderTile({
  obj,
  highlight = false,
  extraGenericCost = 0,
  onClick,
  paired = false,
}: CommanderTileProps) {
  const { wrapRef, popoverRef, open, handlers } = useHoverPopover(obj)
  const clickable = Boolean(onClick) && highlight

  const face = obj.copyOf ?? obj.faceName ?? obj.cardName
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)
  // Queued synchronously during render — see the comment in CardTile.tsx.
  if (!obj.art) queueArtLookup(face)
  const pending = !obj.art && isArtPending(face)
  // `faceIsBack` comes from the engine: a chosen printing is named by
  // card id, which serves the front image unless asked otherwise, and
  // only the registry knows a two-entry `faces` list is a real back face
  // rather than an adventure's spell half.
  const artSrc = resolveArtUrl(obj.art, face, 'art_crop', { backFace: obj.faceIsBack })
  const artFailed = !pending && isArtBlocked(artSrc)
  const tint = cardTint(obj)

  return (
    <div className="commander-tile-wrap" ref={wrapRef} {...handlers}>
      <button
        type="button"
        className={`commander-tile${highlight ? ' highlight' : ''}${clickable ? ' clickable' : ''}${paired ? ' paired' : ''}`}
        onClick={clickable ? onClick : undefined}
        disabled={!clickable}
        // Nothing on the tile spells the name any more, so this is what a
        // screen reader announces for it.
        aria-label={face}
      >
        <span className={`cmdt-art tint-${tint}`}>
          {!pending && !artFailed ? (
            <img src={artSrc} alt="" loading="lazy" onError={() => recordArtFailure(artSrc)} />
          ) : null}
        </span>
        <span className="cmdt-cost">
          <Symbols text={obj.manaCost} />
          {extraGenericCost > 0 ? (
            <span className="ct-tax" title="commander tax">
              +{extraGenericCost}
            </span>
          ) : null}
        </span>
      </button>

      {open
        ? createPortal(
            <div className="mini-tile-popover" ref={popoverRef}>
              <CardTile obj={obj} extraGenericCost={extraGenericCost} badge="Commander" />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

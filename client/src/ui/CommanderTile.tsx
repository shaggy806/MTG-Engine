import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { VisibleObject } from 'engine'
import { CardTile } from './CardTile.tsx'
import { Symbols } from './Symbols.tsx'
import { useHoverPopover } from './useHoverPopover.ts'
import { costColor } from './symbols.ts'
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
}

/**
 * A commander in the command zone reduced to its art plus the three things
 * worth knowing at a glance — name, mana cost (tax included), and P/T or
 * loyalty — with the full `CardTile` on hover, the same trade `MiniTile`
 * makes for the battlefield. The command/library rail is the narrowest
 * column on the board and is height-capped against its quadrant (see
 * `--card-w` in App.css), so a full card face there was both the least
 * readable card on screen and the one taking the most room from the board.
 *
 * The popover is portalled and JS-placed via `useHoverPopover` — see there
 * for why a CSS-revealed child can't escape the quadrant's scroll box.
 */
export function CommanderTile({
  obj,
  highlight = false,
  extraGenericCost = 0,
  onClick,
}: CommanderTileProps) {
  const { wrapRef, popoverRef, open, handlers } = useHoverPopover(obj)
  const clickable = Boolean(onClick) && highlight
  const isCreature = obj.power !== null && obj.toughness !== null

  const face = obj.copyOf ?? obj.faceName ?? obj.cardName
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)
  // Queued synchronously during render — see the comment in CardTile.tsx.
  if (!obj.art) queueArtLookup(face)
  const pending = !obj.art && isArtPending(face)
  const artSrc = resolveArtUrl(obj.art, face)
  const artFailed = !pending && isArtBlocked(artSrc)
  const tint = costColor(obj.manaCost) ?? 'C'

  return (
    <div className="commander-tile-wrap" ref={wrapRef} {...handlers}>
      <button
        type="button"
        className={`commander-tile${highlight ? ' highlight' : ''}${clickable ? ' clickable' : ''}`}
        onClick={clickable ? onClick : undefined}
        disabled={!clickable}
      >
        {/* name banner above the art, matching the board's own MiniTile */}
        <span className="cmdt-name" title={face}>
          {face}
        </span>
        <span className={`cmdt-art tint-${tint}`}>
          {!pending && !artFailed ? (
            <img src={artSrc} alt="" loading="lazy" onError={() => recordArtFailure(artSrc)} />
          ) : null}
        </span>
        <span className="cmdt-row">
          <span className="cmdt-cost">
            <Symbols text={obj.manaCost} />
            {extraGenericCost > 0 ? (
              <span className="ct-tax" title="commander tax">
                +{extraGenericCost}
              </span>
            ) : null}
          </span>
          {isCreature ? (
            <span className="cmdt-pt">
              {obj.power}/{obj.toughness}
            </span>
          ) : obj.loyalty !== null ? (
            <span className="cmdt-pt" title="Loyalty">
              {obj.loyalty}
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

import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { VisibleObject } from 'engine/client'
import { CardTile } from './CardTile.tsx'
import { KEYWORD_GLYPH, keywordLabel } from './abilityIcons.ts'
import { useHoverPopover } from './useHoverPopover.ts'
import { cardTint } from './symbols.ts'
import { LoyaltyCounter } from './Symbols.tsx'
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

export interface MiniTileProps {
  readonly obj: VisibleObject
  readonly highlight?: boolean
  readonly selected?: boolean
  readonly dimmed?: boolean
  readonly activatable?: boolean
  readonly badge?: string | null
  readonly extraGenericCost?: number
  readonly stackCount?: number | null
  /** The seat-colour class of whoever this permanent is attacking, or null.
   * The tile is outlined in it, because the `⚔ <name>` badge is small,
   * overlaid on art and regularly unreadable — colour survives at tile size
   * where four characters of text do not. */
  readonly attackSeat?: string | null
  readonly onClick?: () => void
}

/**
 * A battlefield permanent reduced to a name banner, its image and a stat
 * badge — no cost, type line, or rules text, which is what made the board
 * cluttered at a glance. Hovering (or focusing, for keyboard/touch) reveals
 * the full `CardTile` in a popover anchored to the tile itself. Everywhere
 * else a
 * card needs to be read directly (hand, the stack, library) — that's still
 * `CardTile`, unchanged; this is battlefield-only (see `tileFor`'s `mini`
 * option in `App.tsx`). `CommanderTile` gives the command zone the same
 * treatment in a text-only shape.
 *
 * The popover is portalled to `document.body` and placed from JS — see
 * `useHoverPopover` for why it can't just be a CSS-revealed child.
 */
export function MiniTile({
  obj,
  highlight = false,
  selected = false,
  dimmed = false,
  activatable = false,
  badge = null,
  extraGenericCost = 0,
  stackCount = null,
  attackSeat = null,
  onClick,
}: MiniTileProps) {
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
  const isCreature = obj.power !== null && obj.toughness !== null
  const clickable = Boolean(onClick) && (highlight || selected || activatable)
  const tint = cardTint(obj)

  const { wrapRef, popoverRef, open, handlers } = useHoverPopover(obj)

  const classes = [
    'mini-tile',
    obj.tapped ? 'tapped' : '',
    highlight ? 'highlight' : '',
    selected ? 'selected' : '',
    activatable ? 'activatable' : '',
    dimmed ? 'dimmed' : '',
    attackSeat ? `attacking-at ${attackSeat}` : '',
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
      {...handlers}
    >
      <button
        type="button"
        className={classes}
        onClick={clickable ? onClick : undefined}
        disabled={!clickable}
      >
        {/* The name, on a banner above the art rather than overlaid on it:
            a permanent is recognizable at a glance without hovering, and a
            label strip can't cover the part of the art you'd recognize it
            by. Everything else stays an overlay on the art itself, inside
            .mt-body — which is what carries the 4:3 aspect ratio (and is
            the positioning context for those overlays) now that the tile
            itself is banner + art, not art alone. */}
        <span className="mt-banner" title={obj.name ?? face}>
          {obj.name ?? face}
        </span>
        <span className="mt-body">
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

          {/* One icon per keyword, stacked in the art's corner — enough to
              recognize at a glance which keywords a permanent has; the words
              themselves are in the hover card's keyword line. */}
          {obj.keywords.length > 0 ? (
            <span className="mt-kw">
              {obj.keywords.map((k) => (
                <span key={k} role="img" aria-label={keywordLabel(k)}>
                  {KEYWORD_GLYPH[k]}
                </span>
              ))}
            </span>
          ) : null}

          {isCreature ? (
            <span className="ct-pt">
              {obj.power}/{obj.toughness}
              {obj.damageMarked > 0 ? <span className="ct-dmg"> −{obj.damageMarked}</span> : null}
            </span>
          ) : null}
          {obj.loyalty !== null ? <LoyaltyCounter value={obj.loyalty} /> : null}

          {stackCount !== null && stackCount > 1 ? (
            <span className="card-stack">×{stackCount}</span>
          ) : null}
          {obj.summoningSick && isCreature ? <span className="card-flag sick">Z</span> : null}
          {badge ? <span className="mt-badge">{badge}</span> : null}
          {obj.tapped && TAP_ICON_URL ? (
            <img className="tap-icon" src={TAP_ICON_URL} alt="" />
          ) : null}
        </span>
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

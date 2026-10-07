import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { VisibleObject } from 'engine/client'
import { CardTile } from './CardTile.tsx'
import { keywordLabel } from './abilityIcons.ts'
import { useHoverPopover } from './useHoverPopover.ts'
import { KeywordTips } from './KeywordTips.tsx'
import { KeywordIcon } from './KeywordIcon.tsx'
import { cardTint } from './symbols.ts'
import { LoyaltyCounter } from './Symbols.tsx'
import { manaSymbolUrl } from './mana.ts'
import { TargetedMark } from './TargetedMark.tsx'
import { CardFlags } from './CardFlags.tsx'
import { CounterChips } from './CounterChips.tsx'
import type { Goader } from './CardFlags.tsx'
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
  /** How many of the attacking tokens this tile stands for are blocked
   * (declared, or picked in this seat's block bar): drawn beside the `×N`
   * pill as a shield and the count. 0 draws nothing. */
  readonly blockedCount?: number
  /** The seat-colour class of whoever this permanent is attacking, or null.
   * The tile is outlined in it, because the `⚔ <name>` badge is small,
   * overlaid on art and regularly unreadable — colour survives at tile size
   * where four characters of text do not. */
  readonly attackSeat?: string | null
  /** What on the stack targets this permanent (`Table`'s `aim`), or null:
   * a red frame and a reticle over the art. */
  readonly aimedBy?: string | null
  /** Who has goaded it (`CardFlags`), each with their seat colour. */
  readonly goaders?: readonly Goader[]
  /** The player this Aura is attached to (a Curse), drawn as a flag. */
  readonly enchanting?: Goader | null
  /** The cards in exile this permanent holds (`VisibleObject.holding`),
   * each with what this seat can see of it — `null` for one exiled face
   * down (rule 406.3), drawn as a card back. Shown beside the hover card. */
  readonly held?: readonly HeldCard[]
  readonly onClick?: () => void
}

export interface HeldCard {
  readonly id: string
  readonly obj: VisibleObject | null
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
  blockedCount = 0,
  attackSeat = null,
  aimedBy = null,
  goaders = [],
  enchanting = null,
  held = [],
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

  const { wrapRef, popoverRef, open, handlers } = useHoverPopover(held.length > 0 ? [obj, held] : obj)

  const classes = [
    'mini-tile',
    // A gold name banner, as a legendary card's frame is marked (rule 205.4d).
    obj.supertypes?.includes('legendary') ? 'legendary' : '',
    obj.tapped ? 'tapped' : '',
    highlight ? 'highlight' : '',
    selected ? 'selected' : '',
    activatable ? 'activatable' : '',
    dimmed ? 'dimmed' : '',
    attackSeat ? `attacking-at ${attackSeat}` : '',
    aimedBy !== null ? 'aimed' : '',
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
          {obj.keywords.length > 0 || obj.toxic > 0 ? (
            <span className="mt-kw">
              {obj.keywords.map((k) => (
                <span key={k} role="img" aria-label={keywordLabel(k)}>
                  <KeywordIcon keyword={k} />
                </span>
              ))}
              {/* Toxic is a number, not a keyword (and a granted one shows
                  nowhere else): its total, in poison green. */}
              {obj.toxic > 0 ? (
                <span className="mt-toxic" role="img" aria-label={`Toxic ${obj.toxic}`} title={`Toxic ${obj.toxic}`}>
                  {obj.toxic}
                </span>
              ) : null}
            </span>
          ) : null}

          {isCreature ? (
            <span className="ct-pt">
              {obj.power}/{obj.toughness}
              {obj.damageMarked > 0 ? <span className="ct-dmg"> −{obj.damageMarked}</span> : null}
            </span>
          ) : null}
          {obj.loyalty !== null ? <LoyaltyCounter value={obj.loyalty} /> : null}
          <CounterChips obj={obj} />

          {(stackCount !== null && stackCount > 1) || blockedCount > 0 ? (
            <span className="mt-stack-row">
              {stackCount !== null && stackCount > 1 ? (
                <span className="card-stack">×{stackCount}</span>
              ) : null}
              {blockedCount > 0 ? (
                <span
                  className="mt-blocked"
                  title={`${blockedCount} of ${stackCount ?? blockedCount} blocked`}
                >
                  <span aria-hidden="true">{'\u{1F6E1}'}</span>
                  {blockedCount}
                </span>
              ) : null}
            </span>
          ) : null}
          <CardFlags obj={obj} goaders={goaders} enchanting={enchanting} compact />
          {badge ? <span className="mt-badge">{badge}</span> : null}
          {obj.tapped && TAP_ICON_URL ? (
            <img className="tap-icon" src={TAP_ICON_URL} alt="" />
          ) : null}
          {aimedBy !== null ? <TargetedMark by={aimedBy} /> : null}
        </span>
      </button>

      {open
        ? createPortal(
            <div className={`mini-tile-popover${held.length > 0 ? ' with-held' : ''}`} ref={popoverRef}>
              <CardTile
                obj={obj}
                extraGenericCost={extraGenericCost}
                badge={badge}
                goaders={goaders}
                enchanting={enchanting}
              />
              <KeywordTips obj={obj} />
              {held.length > 0 ? (
                <div className={`popover-held held-${Math.min(held.length, 3)}`}>
                  <span className="popover-held-label">Exiled with it</span>
                  <div className="popover-held-cards">
                    {held.map((h) =>
                      h.obj !== null ? (
                        <CardTile key={h.id} obj={h.obj} />
                      ) : (
                        <div key={h.id} className="card-back" title="face-down card" />
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

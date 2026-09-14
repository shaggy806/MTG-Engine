import { useEffect, useState, useSyncExternalStore } from 'react'
import type { VisibleObject } from 'engine'
import { CardTile } from './CardTile.tsx'
import { costColor } from './symbols.ts'
import { manaSymbolUrl } from './mana.ts'
import {
  artMisses,
  getArtCacheVersion,
  queueArtLookup,
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
  useEffect(() => {
    if (!obj.art) queueArtLookup(face)
  }, [obj.art, face])
  const artSrc = resolveArtUrl(obj.art, face)
  const artFailed = artMisses.has(artSrc)
  const [, forceRerender] = useState(0)
  const isCreature = obj.power !== null && obj.toughness !== null
  const isPlaneswalker = obj.loyalty !== null
  const clickable = Boolean(onClick) && (highlight || selected || activatable)
  const tint = costColor(obj.manaCost) ?? 'C'

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
    <div className="mini-tile-wrap">
      <button
        type="button"
        className={classes}
        onClick={clickable ? onClick : undefined}
        disabled={!clickable}
      >
        <span className={`mt-art tint-${tint}`}>
          {!artFailed ? (
            <img
              src={artSrc}
              alt=""
              loading="lazy"
              onError={() => {
                artMisses.add(artSrc)
                forceRerender((n) => n + 1)
              }}
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

      <div className="mini-tile-popover">
        <CardTile obj={obj} extraGenericCost={extraGenericCost} badge={badge} />
      </div>
    </div>
  )
}

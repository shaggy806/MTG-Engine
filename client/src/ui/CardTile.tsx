import { useState } from 'react'
import type { VisibleObject } from 'engine'
import { Symbols } from './Symbols.tsx'
import { costColor } from './symbols.ts'

export interface CardTileProps {
  readonly obj: VisibleObject
  readonly highlight?: boolean
  readonly selected?: boolean
  readonly dimmed?: boolean
  /** Subtle marker: this permanent has an ability you could activate. */
  readonly activatable?: boolean
  readonly badge?: string | null
  /** A small ordinal shown top-left (blocker damage order). */
  readonly order?: number | null
  /** How many identical permanents this tile stands in for (a land stack). */
  readonly stackCount?: number | null
  /** Shrinks the tile (an Aura/Equipment nested under its host). */
  readonly compact?: boolean
  readonly onClick?: () => void
}

const KEYWORD_LABEL: Record<string, string> = {
  flying: 'Flying',
  vigilance: 'Vigilance',
  haste: 'Haste',
  reach: 'Reach',
  defender: 'Defender',
  trample: 'Trample',
  'first-strike': 'First strike',
  'double-strike': 'Double strike',
  deathtouch: 'Deathtouch',
  lifelink: 'Lifelink',
  menace: 'Menace',
}

/** Scryfall serves art crops for real card names straight from this URL. */
const artUrl = (name: string): string =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
    name,
  )}&format=image&version=art_crop`

/** Card names whose art 404'd this session — don't re-request on every remount. */
const artMisses = new Set<string>()

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

function typeLine(obj: VisibleObject): string {
  const types = obj.types.map(cap).join(' ')
  return obj.subtypes.length > 0
    ? `${types} — ${obj.subtypes.join(' ')}`
    : types
}

/** True when `text` only restates the card's keywords (e.g. "First strike"). */
function textIsJustKeywords(obj: VisibleObject): boolean {
  if (obj.text.length === 0) return false
  const kw = new Set(
    obj.keywords.flatMap((k) => k.replace(/-/g, ' ').toLowerCase().split(' ')),
  )
  const words = obj.text.toLowerCase().split(/[\s,.]+/).filter(Boolean)
  return words.length > 0 && words.every((w) => kw.has(w))
}

export function CardTile({
  obj,
  highlight = false,
  selected = false,
  dimmed = false,
  activatable = false,
  badge = null,
  order = null,
  stackCount = null,
  compact = false,
  onClick,
}: CardTileProps) {
  const [artFailed, setArtFailed] = useState(() => artMisses.has(obj.cardName))
  const isCreature = obj.power !== null && obj.toughness !== null
  const counters = Object.entries(obj.counters).filter(([, n]) => n !== 0)
  const clickable = Boolean(onClick) && (highlight || selected || activatable)
  const showText = obj.text.length > 0 && !textIsJustKeywords(obj)
  const keywordLine = obj.keywords
    .map((k) => KEYWORD_LABEL[k] ?? cap(k))
    .join(', ')
  const tint = costColor(obj.manaCost) ?? 'C'

  const classes = [
    'card-tile',
    obj.tapped ? 'tapped' : '',
    highlight ? 'highlight' : '',
    selected ? 'selected' : '',
    activatable ? 'activatable' : '',
    dimmed ? 'dimmed' : '',
    clickable ? 'clickable' : '',
    compact ? 'compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={obj.text || obj.cardName}
    >
      <span className="ct-title">
        <span className="ct-name">{obj.cardName}</span>
        {obj.manaCost ? (
          <span className="ct-cost">
            <Symbols text={obj.manaCost} />
          </span>
        ) : null}
      </span>

      <span className={`ct-art tint-${tint}`}>
        {!artFailed ? (
          <img
            src={artUrl(obj.cardName)}
            alt=""
            loading="lazy"
            onError={() => {
              artMisses.add(obj.cardName)
              setArtFailed(true)
            }}
          />
        ) : null}
      </span>

      <span className="ct-type">{typeLine(obj)}</span>

      <span className="ct-text">
        {keywordLine ? <b className="ct-kw">{keywordLine}</b> : null}
        {showText ? (
          <span className="ct-rules">
            <Symbols text={obj.text} />
          </span>
        ) : null}
        {counters.length > 0 ? (
          <span className="ct-counters">
            {counters.map(([k, n]) => (
              <span key={k}>
                {n}× {k}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      {isCreature ? (
        <span className="ct-pt">
          {obj.power}/{obj.toughness}
          {obj.damageMarked > 0 ? (
            <span className="ct-dmg"> −{obj.damageMarked}</span>
          ) : null}
        </span>
      ) : null}

      {order !== null ? <span className="card-order">{order}</span> : null}
      {stackCount !== null && stackCount > 1 ? (
        <span className="card-stack">×{stackCount}</span>
      ) : null}
      {obj.summoningSick && isCreature ? (
        <span className="card-flag sick">sick</span>
      ) : null}
      {badge ? <span className="card-badge">{badge}</span> : null}
    </button>
  )
}

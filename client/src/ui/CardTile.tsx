import { useState } from 'react'
import type { VisibleObject } from 'engine'

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
  readonly onClick?: () => void
}

const KEYWORD_ABBR: Record<string, string> = {
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

/** `{1}{G}` -> [{sym:'1',color:'generic'}, {sym:'G',color:'G'}] */
function manaPips(cost: string | null): { sym: string; color: string }[] {
  if (!cost) return []
  const out: { sym: string; color: string }[] = []
  for (const m of cost.matchAll(/\{([^}]+)\}/g)) {
    const s = m[1]
    out.push({ sym: s, color: /^[WUBRGC]$/.test(s) ? s : 'generic' })
  }
  return out
}

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
  onClick,
}: CardTileProps) {
  const [artFailed, setArtFailed] = useState(() => artMisses.has(obj.cardName))
  const isCreature = obj.power !== null && obj.toughness !== null
  const counters = Object.entries(obj.counters).filter(([, n]) => n !== 0)
  const clickable = Boolean(onClick) && (highlight || selected || activatable)
  const pips = manaPips(obj.manaCost)
  const showText = obj.text.length > 0 && !textIsJustKeywords(obj)
  const keywordLine = obj.keywords
    .map((k) => KEYWORD_ABBR[k] ?? cap(k))
    .join(', ')
  const tint = pips.find((p) => p.color !== 'generic')?.color ?? 'C'

  const classes = [
    'card-tile',
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
    <button
      type="button"
      className={classes}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={obj.text || obj.cardName}
    >
      <span className="ct-title">
        <span className="ct-name">{obj.cardName}</span>
        {pips.length > 0 ? (
          <span className="ct-cost">
            {pips.map((p, i) => (
              <span key={i} className={`pip pip-${p.color}`}>
                {p.sym}
              </span>
            ))}
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
        {isCreature ? (
          <span className="ct-pt">
            {obj.power}/{obj.toughness}
            {obj.damageMarked > 0 ? (
              <span className="ct-dmg"> −{obj.damageMarked}</span>
            ) : null}
          </span>
        ) : null}
      </span>

      <span className="ct-type">{typeLine(obj)}</span>

      <span className="ct-text">
        {keywordLine ? <b className="ct-kw">{keywordLine}</b> : null}
        {showText ? <span className="ct-rules">{obj.text}</span> : null}
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

      {order !== null ? <span className="card-order">{order}</span> : null}
      {obj.summoningSick && isCreature ? (
        <span className="card-flag sick">sick</span>
      ) : null}
      {badge ? <span className="card-badge">{badge}</span> : null}
    </button>
  )
}

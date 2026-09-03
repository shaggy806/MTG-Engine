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
  flying: 'FLY',
  vigilance: 'VIG',
  haste: 'HST',
  reach: 'RCH',
  defender: 'DEF',
  trample: 'TRM',
  'first strike': 'FS',
  deathtouch: 'DT',
  lifelink: 'LL',
  menace: 'MEN',
}

/** Scryfall serves art crops for real card names straight from this URL. */
const artUrl = (name: string): string =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
    name,
  )}&format=image&version=art_crop`

/** Card names whose art 404'd this session — don't re-request on every remount. */
const artMisses = new Set<string>()

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

  const classes = [
    'card-tile',
    obj.tapped ? 'tapped' : '',
    highlight ? 'highlight' : '',
    selected ? 'selected' : '',
    activatable ? 'activatable' : '',
    dimmed ? 'dimmed' : '',
    clickable ? 'clickable' : '',
    artFailed ? 'no-art' : '',
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
      {!artFailed ? (
        <img
          className="card-art"
          src={artUrl(obj.cardName)}
          alt=""
          loading="lazy"
          onError={() => {
            artMisses.add(obj.cardName)
            setArtFailed(true)
          }}
        />
      ) : null}
      <span className="card-body">
        <span className="card-name">{obj.cardName}</span>
        <span className="card-foot">
          {counters.length > 0 ? (
            <span className="card-counters">
              {counters.map(([k, n]) => (
                <span key={k}>
                  {n}× {k}
                </span>
              ))}
            </span>
          ) : null}
          {obj.keywords.length > 0 ? (
            <span className="card-kw">
              {obj.keywords.map((kw) => (
                <span key={kw}>
                  {KEYWORD_ABBR[kw] ?? kw.slice(0, 3).toUpperCase()}
                </span>
              ))}
            </span>
          ) : null}
          <span className="card-meta">
            {obj.manaCost && !isCreature ? (
              <span className="card-cost">{obj.manaCost}</span>
            ) : null}
            {isCreature ? (
              <span className="card-pt">
                {obj.power}/{obj.toughness}
                {obj.damageMarked > 0 ? (
                  <span className="card-dmg"> −{obj.damageMarked}</span>
                ) : null}
              </span>
            ) : null}
          </span>
        </span>
      </span>
      {order !== null ? <span className="card-order">{order}</span> : null}
      {obj.summoningSick && isCreature ? (
        <span className="card-flag sick">sick</span>
      ) : null}
      {badge ? <span className="card-badge">{badge}</span> : null}
    </button>
  )
}

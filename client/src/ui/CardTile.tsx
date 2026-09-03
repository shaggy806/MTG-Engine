import type { VisibleObject } from 'engine'

export interface CardTileProps {
  readonly obj: VisibleObject
  readonly highlight?: boolean
  readonly selected?: boolean
  readonly dimmed?: boolean
  /** Subtle marker: this permanent has an ability you could activate. */
  readonly activatable?: boolean
  readonly badge?: string | null
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

export function CardTile({
  obj,
  highlight = false,
  selected = false,
  dimmed = false,
  activatable = false,
  badge = null,
  onClick,
}: CardTileProps) {
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
      <div className="card-name">{obj.cardName}</div>
      <div className="card-meta">
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
      </div>
      {obj.keywords.length > 0 ? (
        <div className="card-kw">
          {obj.keywords.map((kw) => (
            <span key={kw}>{KEYWORD_ABBR[kw] ?? kw.slice(0, 3).toUpperCase()}</span>
          ))}
        </div>
      ) : null}
      {counters.length > 0 ? (
        <div className="card-counters">
          {counters.map(([k, n]) => (
            <span key={k}>
              {n}× {k}
            </span>
          ))}
        </div>
      ) : null}
      {obj.summoningSick && isCreature ? (
        <div className="card-flag sick">sick</div>
      ) : null}
      {badge ? <div className="card-badge">{badge}</div> : null}
    </button>
  )
}

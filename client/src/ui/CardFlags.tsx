import type { CSSProperties } from 'react'
import type { VisibleObject } from 'engine/client'

/** A player who goaded a creature, as a tile draws them: their seat colour
 * class (`seatClassOf`) and display name. */
export interface Goader {
  readonly seat: string
  readonly name: string
}

/**
 * The small chips along a permanent's bottom-left corner: summoning sickness,
 * and the designations nothing else on the tile shows — goaded (rule 701.15)
 * and suspected (701.60). A designation isn't an ability, so it isn't in the
 * keyword icons; suspect's menace and can't-block are, but not the fact that
 * it's suspected. Also how many cards it holds in exile (`holding` — a
 * Banishing Light's), which the hover card shows.
 *
 * A goad chip is drawn in its goader's seat colour and names them, because
 * who goaded it is the part that matters: it has to attack someone else.
 * `compact` is the battlefield tile's short form ("Z", "Goad", "Sus").
 */
export function CardFlags({
  obj,
  goaders,
  compact,
}: {
  readonly obj: VisibleObject
  readonly goaders: readonly Goader[]
  readonly compact: boolean
}) {
  const sick = obj.summoningSick && obj.power !== null && obj.toughness !== null
  const held = obj.holding?.length ?? 0
  if (!sick && goaders.length === 0 && !obj.suspected && held === 0) return null
  return (
    <span className="card-flags">
      {sick ? <span className="card-flag sick">{compact ? 'Z' : 'sick'}</span> : null}
      {goaders.map((g) => (
        <span
          key={g.seat}
          className="card-flag goad"
          style={{ '--goader': `var(--${g.seat})` } as CSSProperties}
          title={`Goaded by ${g.name}: it attacks each combat if able, and a player other than ${g.name} if able`}
        >
          {compact ? 'Goad' : 'goaded'}
        </span>
      ))}
      {obj.suspected ? (
        <span className="card-flag suspect" title="Suspected: it has menace and can't block">
          {compact ? 'Sus' : 'suspected'}
        </span>
      ) : null}
      {held > 0 ? (
        <span
          className="card-flag holding"
          title={`Holding ${held} card${held === 1 ? '' : 's'} in exile — hover to see`}
        >
          {compact ? `Ex ${held}` : `${held} exiled`}
        </span>
      ) : null}
    </span>
  )
}

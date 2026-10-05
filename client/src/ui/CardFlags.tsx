import type { CSSProperties } from 'react'
import type { VisibleObject } from 'engine/client'

/** A player who goaded a creature, as a tile draws them: their seat colour
 * class (`seatClassOf`) and display name. */
export interface Goader {
  readonly seat: string
  readonly name: string
}

/** A chosen colour is stored as its mana letter (Heraldic Banner's `"U"`). */
const COLOR_WORD: Readonly<Record<string, string>> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
}

/**
 * The small chips along a permanent's bottom-left corner: summoning sickness,
 * and the designations nothing else on the tile shows — goaded (rule 701.15)
 * and suspected (701.60). A designation isn't an ability, so it isn't in the
 * keyword icons; suspect's menace and can't-block are, but not the fact that
 * it's suspected. Also how many cards it holds in exile (`holding` — a
 * Banishing Light's), which the hover card shows, and what was chosen as it
 * entered (`chosen` — Frostcliff Siege's "Jeskai" or "Temur"), since that
 * decides which of its abilities it has and nothing else on the card says.
 *
 * A goad chip is drawn in its goader's seat colour and names them, because
 * who goaded it is the part that matters: it has to attack someone else.
 * `compact` is the battlefield tile's short form ("Z", "Goad", "Sus").
 *
 * A Curse names the player it enchants (`enchanting`), in their seat colour:
 * it sits on its controller's board but is attached to someone else.
 */
export function CardFlags({
  obj,
  goaders,
  compact,
  enchanting = null,
}: {
  readonly obj: VisibleObject
  readonly goaders: readonly Goader[]
  readonly compact: boolean
  /** The player this Aura is attached to (a Curse), or null. */
  readonly enchanting?: Goader | null
}) {
  const sick = obj.summoningSick && obj.power !== null && obj.toughness !== null
  const held = obj.holding?.length ?? 0
  const chosen = obj.chosen === undefined ? null : (COLOR_WORD[obj.chosen] ?? obj.chosen)
  if (!sick && goaders.length === 0 && !obj.suspected && held === 0 && chosen === null && enchanting === null) {
    return null
  }
  return (
    <span className="card-flags">
      {sick ? <span className="card-flag sick">{compact ? 'Z' : 'sick'}</span> : null}
      {enchanting !== null ? (
        <span
          className="card-flag enchanting"
          style={{ '--goader': `var(--${enchanting.seat})` } as CSSProperties}
          title={`Enchanting ${enchanting.name}`}
        >
          {compact ? `→ ${enchanting.name}` : `on ${enchanting.name}`}
        </span>
      ) : null}
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
      {chosen !== null ? (
        <span className="card-flag chosen" title={`Chosen as it entered: ${chosen}`}>
          {compact ? chosen : `chose ${chosen}`}
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

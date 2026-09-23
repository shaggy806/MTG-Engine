import { manaSymbolUrl } from './mana.ts'
import { LOYALTY_GLYPH } from './abilityIcons.ts'
import { parseSymbols, pipClass, SYMBOL_GLYPH, type LoyaltyCost } from './symbols.ts'
import './symbols.css'

/**
 * Renders a string with `{…}` tokens as small inline symbol pips:
 * `{T}: Add {G}.` → a tap pip, "  Add ", a green "G" pip, ".".
 *
 * Each token uses its WotC artwork (`./mana/<token>.svg`) when we have it;
 * anything without artwork ({C}, exotic symbols) falls back to a CSS pip.
 * A planeswalker ability's loyalty cost at the start of a line (`[+1]:`)
 * becomes the printed loyalty badge — see `LoyaltyBadge`.
 */
export function Symbols({ text }: { readonly text: string | null }) {
  return (
    <>
      {parseSymbols(text).map((c, i) => {
        if (c.loyalty) return <LoyaltyBadge key={i} cost={c.loyalty} />
        if (c.symbol === null) return <span key={i}>{c.text}</span>
        const url = manaSymbolUrl(c.symbol)
        if (url !== null) {
          return (
            <img key={i} className="pip pip-img" src={url} alt={`{${c.symbol}}`} />
          )
        }
        return (
          <span key={i} className={`pip ${pipClass(c.symbol)}`}>
            {SYMBOL_GLYPH[c.symbol] ?? c.symbol}
          </span>
        )
      })}
    </>
  )
}

/** A planeswalker's current loyalty, in the shield its card prints the
 * starting loyalty in — the tile's own stat badge, as P/T is a creature's.
 * Positioned by the tile (`.ct-loyalty`); the shape and number are the same
 * overlay the loyalty costs use. */
export function LoyaltyCounter({ value }: { readonly value: number }) {
  return (
    <span className="ct-loyalty loyalty-cost loyalty-start" title="Loyalty">
      <span className="loyalty-shape" aria-hidden="true">
        {LOYALTY_GLYPH.start}
      </span>
      <span className="loyalty-num">{value}</span>
    </span>
  )
}

/** How a cost reads: a real minus sign, not the hyphen the text was typed
 * with, the way the card prints it. */
const loyaltyText = ({ kind, value }: LoyaltyCost): string =>
  kind === 'up' ? `+${value}` : kind === 'down' ? `−${value}` : value

/**
 * A loyalty cost drawn the way a planeswalker card prints it: the Mana
 * font's up, down or zero shape (see `abilityIcons.ts`), with the number
 * laid over it as ordinary text. The two share one grid cell so the number
 * centres on the shape at any font size.
 */
export function LoyaltyBadge({ cost }: { readonly cost: LoyaltyCost }) {
  const label = loyaltyText(cost)
  return (
    <span className={`loyalty-cost loyalty-${cost.kind}`} role="img" aria-label={`${label} loyalty`}>
      <span className="loyalty-shape" aria-hidden="true">
        {LOYALTY_GLYPH[cost.kind]}
      </span>
      <span className="loyalty-num" aria-hidden="true">
        {label}
      </span>
    </span>
  )
}

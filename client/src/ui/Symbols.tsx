import { manaSymbolUrl } from './mana.ts'
import { parseSymbols, pipClass, SYMBOL_GLYPH } from './symbols.ts'

/**
 * Renders a string with `{…}` tokens as small inline symbol pips:
 * `{T}: Add {G}.` → a tap pip, "  Add ", a green "G" pip, ".".
 *
 * Each token uses its WotC artwork (`./mana/<token>.svg`) when we have it;
 * anything without artwork ({C}, exotic symbols) falls back to a CSS pip.
 */
export function Symbols({ text }: { readonly text: string | null }) {
  return (
    <>
      {parseSymbols(text).map((c, i) => {
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

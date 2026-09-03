import { parseSymbols, pipClass, SYMBOL_GLYPH } from './symbols.ts'

/**
 * Renders a string with `{…}` tokens as small inline symbol pips:
 * `{T}: Add {G}.` → a ↻ pip, "  Add ", a green "G" pip, ".".
 */
export function Symbols({ text }: { readonly text: string | null }) {
  return (
    <>
      {parseSymbols(text).map((c, i) =>
        c.symbol === null ? (
          <span key={i}>{c.text}</span>
        ) : (
          <span key={i} className={`pip ${pipClass(c.symbol)}`}>
            {SYMBOL_GLYPH[c.symbol] ?? c.symbol}
          </span>
        ),
      )}
    </>
  )
}

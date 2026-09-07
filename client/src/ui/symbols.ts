/** Parsing helpers for `{…}` mana / tap / cost tokens in card strings. */

export interface Chunk {
  readonly text: string
  readonly symbol: string | null
}

/** Split a string into plain-text and `{…}` symbol chunks. */
export function parseSymbols(str: string | null): Chunk[] {
  if (!str) return []
  const out: Chunk[] = []
  let last = 0
  for (const m of str.matchAll(/\{([^}]+)\}/g)) {
    if (m.index > last) {
      out.push({ text: str.slice(last, m.index), symbol: null })
    }
    out.push({ text: '', symbol: m[1] })
    last = m.index + m[0].length
  }
  if (last < str.length) out.push({ text: str.slice(last), symbol: null })
  return out
}

/** The pip CSS class for one `{…}` token. */
export function pipClass(sym: string): string {
  if (sym === 'T') return 'pip-tap'
  if (sym === 'Q') return 'pip-untap'
  if (/^[WUBRGC]$/.test(sym)) return `pip-${sym}`
  if (sym.includes('/')) {
    // Hybrid / twobrid / Phyrexian pip ({W/U}, {2/W}, {R/P}) — tint by the
    // first colour half if there is one, and render as a wider pill.
    const color = sym.split('/').find((p) => /^[WUBRG]$/.test(p))
    return color ? `pip-hybrid pip-${color}` : 'pip-hybrid pip-generic'
  }
  return 'pip-generic'
}

export const SYMBOL_GLYPH: Record<string, string> = {
  T: '↻',
  Q: '↺',
}

/** The first coloured mana symbol in a cost string, or `null`. */
export function costColor(cost: string | null): string | null {
  for (const c of parseSymbols(cost)) {
    if (c.symbol && /^[WUBRG]$/.test(c.symbol)) return c.symbol
  }
  return null
}

/** Parsing helpers for `{…}` mana / tap / cost tokens in card strings. */

/** A planeswalker loyalty ability's cost: `up` adds counters, `down` removes
 * them, `zero` does neither. `value` is the digits (or `X`), unsigned. */
export interface LoyaltyCost {
  readonly kind: 'up' | 'down' | 'zero'
  readonly value: string
}

export interface Chunk {
  readonly text: string
  readonly symbol: string | null
  /** Set on a chunk that is a loyalty cost rather than text or a `{…}`
   * token — see `parseSymbols`. */
  readonly loyalty?: LoyaltyCost
}

/**
 * `{…}` tokens anywhere, or a loyalty cost opening a line and followed by its
 * colon. The pool writes costs bracketed (`[+1]:`, `[-4]:`, `[0]:`), but
 * Oracle text and the odd ability's own `text` write them bare (`+1:`,
 * `−2:`, `0:`), so both forms count. Only at a line's start, because that's
 * the only place a cost is ever printed, and it keeps a "+1/+1" or a "[3]"
 * elsewhere in rules text from reading as one.
 */
const TOKEN =
  /\{([^}]+)\}|(^|\n)(?:\[([+\-−]?)(\d+|X)\]|([+\-−])(\d+|X)|(0))(?=:)/g

function loyaltyOf(sign: string, value: string): LoyaltyCost | null {
  if (sign === '+') return { kind: 'up', value }
  if (sign === '-' || sign === '−') return { kind: 'down', value }
  // Unsigned: only zero is a cost. "[3]:" isn't one.
  return value === '0' ? { kind: 'zero', value } : null
}

/** Split a string into plain-text, `{…}` symbol and loyalty-cost chunks. */
export function parseSymbols(str: string | null): Chunk[] {
  if (!str) return []
  const out: Chunk[] = []
  let last = 0
  for (const m of str.matchAll(TOKEN)) {
    const [whole, symbol, lineStart, bracketSign, bracketValue, bareSign, bareValue, bareZero] = m
    const loyalty =
      symbol !== undefined
        ? null
        : bracketValue !== undefined
          ? loyaltyOf(bracketSign ?? '', bracketValue)
          : loyaltyOf(bareSign ?? '', bareValue ?? bareZero ?? '')
    // An unsigned bracket that isn't zero is just text; leave it be.
    if (symbol === undefined && loyalty === null) continue
    // The newline a line-start match consumed still belongs to the text.
    const start = m.index + (lineStart ?? '').length
    if (start > last) out.push({ text: str.slice(last, start), symbol: null })
    out.push(
      symbol !== undefined
        ? { text: '', symbol }
        : { text: '', symbol: null, loyalty: loyalty ?? undefined },
    )
    last = m.index + whole.length
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

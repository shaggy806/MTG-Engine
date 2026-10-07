import { describe, expect, it } from 'vitest'
import type { DeckFormatReport, ImportedCardReport } from 'protocol'
import { looksLikeDecklist, resolveImport } from './importDeck.ts'

const card = (name: string, extra: Partial<ImportedCardReport> = {}): ImportedCardReport => ({
  name,
  count: 1,
  implemented: true,
  found: true,
  manaCost: null,
  typeLine: '',
  suggestedReplacement: null,
  replacements: [],
  printingId: null,
  ...extra,
})

const format = (commanders: readonly string[]): DeckFormatReport => ({
  legal: true,
  violations: [],
  identity: 'G',
  commanders,
})

describe('looksLikeDecklist', () => {
  it('wants at least one "N Card Name" line', () => {
    expect(looksLikeDecklist('Commander\n1 Ghalta, Primal Hunger\n\n30 Forest')).toBe(true)
    expect(looksLikeDecklist('https://example.com/some/link')).toBe(false)
    expect(looksLikeDecklist('')).toBe(false)
  })
})

describe('resolveImport', () => {
  it('keeps implemented cards, swaps in stand-ins and drops what has none', () => {
    const resolved = resolveImport(
      [
        card('Ghalta, Primal Hunger'),
        card('Forest', { count: 3, printingId: 'abc' }),
        card('Tooth and Nail', { implemented: false, suggestedReplacement: 'Natural Order' }),
        card('Nothing Like It', { implemented: false }),
      ],
      format(['Ghalta, Primal Hunger']),
    )
    expect(resolved.name).toBe('Imported: Ghalta, Primal Hunger')
    expect(resolved.commanders).toEqual(['Ghalta, Primal Hunger'])
    expect(resolved.cards).toEqual(['Forest', 'Forest', 'Forest', 'Natural Order'])
    expect(resolved.printings).toEqual({ Forest: 'abc' })
    expect(resolved.report.substituted.map((s) => [s.from, s.to])).toEqual([['Tooth and Nail', 'Natural Order']])
    expect(resolved.report.dropped).toEqual(['Nothing Like It'])
    expect(resolved.report.asIs).toBe(2)
  })

  it('stands a commander in by its replacement, and has none when the list named none', () => {
    const swapped = resolveImport(
      [card('Unimplemented Legend', { implemented: false, suggestedReplacement: 'Ghalta, Primal Hunger' })],
      format(['Unimplemented Legend']),
    )
    expect(swapped.commanders).toEqual(['Ghalta, Primal Hunger'])
    expect(swapped.cards).toEqual([])

    expect(resolveImport([card('Forest')], null).commanders).toEqual([])
  })
})

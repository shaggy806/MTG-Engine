import { describe, expect, it } from 'vitest'
import { stripReminders, tipsFor } from './textKeywords.ts'

describe('reminder text', () => {
  it('drops an aside that explains a term with a tooltip', () => {
    expect(stripReminders('Flying (This creature can\'t be blocked except by creatures with flying or reach.)\nWhen this enters, draw a card.')).toBe(
      'Flying\nWhen this enters, draw a card.',
    )
    expect(stripReminders('Ward {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)')).toBe('Ward {2}')
    expect(stripReminders('When this enters, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)')).toBe(
      'When this enters, scry 2.',
    )
    expect(stripReminders('Kicker {1}{R} (You may pay an additional {1}{R} as you cast this spell.)\nDeal 2 damage.')).toBe('Kicker {1}{R}\nDeal 2 damage.')
  })

  it('keeps an aside nothing else would say', () => {
    expect(stripReminders('({T}: Add {G}.)')).toBe('({T}: Add {G}.)')
    expect(stripReminders('Choose one or more — (You may choose the same mode more than once.)')).toBe(
      'Choose one or more — (You may choose the same mode more than once.)',
    )
    // A term in an earlier sentence doesn't reach an aside after a later one.
    expect(stripReminders('Flying. When this enters, return a card. (Any card.)')).toBe('Flying. When this enters, return a card. (Any card.)')
  })
})

describe('tooltips for a card', () => {
  it('lists its keywords, then terms its text uses, each once, and not words from inside a reminder', () => {
    const text = stripReminders('Flying (This creature can\'t be blocked except by creatures with flying or reach.)\nWard {2}\nProwess\nWhenever this attacks, create a Treasure token and scry 1.')
    expect(tipsFor(['flying'], text).map((t) => t.name)).toEqual(['Flying', 'Ward', 'Prowess', 'Scry', 'Treasure'])
  })

  it('explains a keyword the text grants, and tells storm from Dragonstorm', () => {
    expect(tipsFor([], 'Target creature gains first strike until end of turn.').map((t) => t.name)).toEqual(['First strike'])
    expect(tipsFor([], 'Search for Breaching Dragonstorm.')).toEqual([])
    expect(tipsFor([], 'This creature is equipped.')).toEqual([])
  })
})

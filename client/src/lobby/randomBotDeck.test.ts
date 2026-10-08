import { describe, expect, it } from 'vitest'
import { BENCH_DECKS, SAMPLE_DECKS, UPGRADED_DECKS } from 'engine/client'
import type { SeatStatus } from 'protocol'
import { randomBotDeck, randomBotDecks } from './randomBotDeck.ts'

const seatWith = (name: string | null): SeatStatus =>
  ({ deck: name === null ? null : { name, commanders: [] } }) as unknown as SeatStatus

describe('randomBotDeck', () => {
  it('picks among the starter decks by the random number', () => {
    expect(randomBotDeck([], () => 0).name).toBe(SAMPLE_DECKS[0].name)
    expect(randomBotDeck([], () => 0.999).name).toBe(SAMPLE_DECKS.at(-1)?.name)
  })

  it('can give any starter deck, not only the bench ones', () => {
    const picked = new Set(SAMPLE_DECKS.map((_, i) => randomBotDeck([], () => (i + 0.5) / SAMPLE_DECKS.length).name))
    expect(picked).toEqual(new Set(SAMPLE_DECKS.map((d) => d.name)))
    expect(picked.size).toBeGreaterThan(BENCH_DECKS.length)
  })

  it('skips a deck another seat already plays', () => {
    const seats = [seatWith(SAMPLE_DECKS[0].name), seatWith(null)]
    expect(randomBotDeck(seats, () => 0).name).toBe(SAMPLE_DECKS[1].name)
  })

  it('repeats one when every starter deck is taken', () => {
    const seats = SAMPLE_DECKS.map((d) => seatWith(d.name))
    const deck = randomBotDeck(seats, () => 0)
    expect(deck.name).toBe(SAMPLE_DECKS[0].name)
    expect(deck.cards).toEqual(SAMPLE_DECKS[0].cards)
    expect(deck.commanders).toEqual(SAMPLE_DECKS[0].commanders)
  })
})

describe('randomBotDecks', () => {
  it('gives each bot a different deck, none the table already plays', () => {
    const decks = randomBotDecks(3, [SAMPLE_DECKS[0].name], () => 0)
    expect(decks.map((d) => d.name)).toEqual([SAMPLE_DECKS[1].name, SAMPLE_DECKS[2].name, SAMPLE_DECKS[3].name])
  })
})

describe('the upgraded pool', () => {
  it('deals the upgraded precons, still one per seat', () => {
    expect(randomBotDeck([], () => 0, 'upgraded').name).toBe(UPGRADED_DECKS[0].name)
    const decks = randomBotDecks(3, [], () => 0, 'upgraded')
    expect(decks.map((d) => d.name)).toEqual(UPGRADED_DECKS.slice(0, 3).map((d) => d.name))
  })
})

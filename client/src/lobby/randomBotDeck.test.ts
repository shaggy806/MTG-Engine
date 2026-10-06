import { describe, expect, it } from 'vitest'
import { BENCH_DECKS } from 'engine/client'
import type { SeatStatus } from 'protocol'
import { randomBotDeck } from './randomBotDeck.ts'

const seatWith = (name: string | null): SeatStatus =>
  ({ deck: name === null ? null : { name, commanders: [] } }) as unknown as SeatStatus

describe('randomBotDeck', () => {
  it('picks among the bench decks by the random number', () => {
    expect(randomBotDeck([], () => 0).name).toBe(BENCH_DECKS[0].name)
    expect(randomBotDeck([], () => 0.999).name).toBe(BENCH_DECKS.at(-1)?.name)
  })

  it('skips a deck another seat already plays', () => {
    const seats = [seatWith(BENCH_DECKS[0].name), seatWith(null)]
    expect(randomBotDeck(seats, () => 0).name).toBe(BENCH_DECKS[1].name)
  })

  it('repeats one when every bench deck is taken', () => {
    const seats = BENCH_DECKS.map((d) => seatWith(d.name))
    const deck = randomBotDeck(seats, () => 0)
    expect(deck.name).toBe(BENCH_DECKS[0].name)
    expect(deck.cards).toEqual(BENCH_DECKS[0].cards)
    expect(deck.commanders).toEqual(BENCH_DECKS[0].commanders)
  })
})

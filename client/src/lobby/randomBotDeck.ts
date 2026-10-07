import { SAMPLE_DECKS } from 'engine/client'
import type { SampleDeck } from 'engine/client'
import type { SeatStatus, WireDeck } from 'protocol'

/**
 * The deck the lobby's "Add bot (random deck)" gives a bot: one of the
 * starter decks (`SAMPLE_DECKS`, the ones the deck builder offers) at random
 * — one no other seat at the table is already playing, while there is one.
 * `random` is `Math.random`, passed in for tests.
 */
export function randomBotDeck(seats: readonly SeatStatus[], random: () => number = Math.random): WireDeck {
  const taken = new Set(seats.flatMap((s) => (s.deck === null ? [] : [s.deck.name])))
  const free = SAMPLE_DECKS.filter((d) => !taken.has(d.name))
  const pool: readonly SampleDeck[] = free.length > 0 ? free : SAMPLE_DECKS
  const deck = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
  return { cards: deck.cards, commanders: deck.commanders, name: deck.name }
}

/**
 * Decks for `count` bots at once, all different from each other and from
 * `taken` (the names already at the table) while the starter decks last —
 * a blitz game's three opponents, picked before its room exists.
 */
export function randomBotDecks(
  count: number,
  taken: readonly string[] = [],
  random: () => number = Math.random,
): WireDeck[] {
  const picked: WireDeck[] = []
  for (let i = 0; i < count; i += 1) {
    const names = [...taken, ...picked.map((d) => d.name ?? '')]
    const seats = names.map((name) => ({ deck: { name, commanders: [] } }) as unknown as SeatStatus)
    picked.push(randomBotDeck(seats, random))
  }
  return picked
}

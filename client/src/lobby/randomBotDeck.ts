import { BENCH_DECKS } from 'engine/client'
import type { SampleDeck } from 'engine/client'
import type { SeatStatus, WireDeck } from 'protocol'

/**
 * The deck the lobby's "Add bot (random deck)" gives a bot: one of the decks
 * the bots are measured on and pilot best (`BENCH_DECKS`, which the server's
 * own per-seat fallback also draws from), at random — one no other seat at
 * the table is already playing, while there is one. `random` is
 * `Math.random`, passed in for tests.
 */
export function randomBotDeck(seats: readonly SeatStatus[], random: () => number = Math.random): WireDeck {
  const taken = new Set(seats.flatMap((s) => (s.deck === null ? [] : [s.deck.name])))
  const free = BENCH_DECKS.filter((d) => !taken.has(d.name))
  const pool: readonly SampleDeck[] = free.length > 0 ? free : BENCH_DECKS
  const deck = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
  return { cards: deck.cards, commanders: deck.commanders, name: deck.name }
}

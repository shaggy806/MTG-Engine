import { useSyncExternalStore } from 'react'
import type { CardDefinition, CardShard } from 'engine/client'
import { CARD_SHARD_COUNT, CardRegistry, cardShardOf, loadCardShard } from 'engine/client'

/**
 * The card pool, fetched as it's needed.
 *
 * The engine ships the pool as shards, each its own file in the build (see
 * `engine/src/cards/card-shards.ts`), and this module is the client's one way
 * into them. Nothing here is on any page's startup path. There are two kinds
 * of caller:
 *
 * - **A lookup by name** (`peekCard`, `loadCard`, `requestCards`,
 *   `useCardData`). The game page needs a definition only for extras: the
 *   tooltip on a card's name in the history, or the other face of a
 *   double-faced card in a zone viewer. Everything a game needs to be played
 *   arrives in the server's views, with each object's characteristics
 *   already worked out. A lookup fetches the one shard its name hashes to,
 *   the first time anything asks.
 * - **The whole pool** (`loadCardPool`, `cardPool`), for the library and the
 *   deck builder, which search, sort and validate over every card.
 *   `main.tsx` fetches it alongside the page's own code and renders the page
 *   once both are in, so inside those pages `cardPool()` is always ready.
 *
 * Art is the exception, since the lobby draws commander art before anyone
 * has asked for a card. The engine's `PINNED_ART` holds the few printings
 * the pool pins, and every other card is found on Scryfall by name.
 *
 * A shard that fails to load (a network error, or a deploy that replaced the
 * build while a page was open) reads as not loaded yet, and is fetched again
 * the next time something asks for it.
 */

const shards = new Map<number, CardShard>()
const inFlight = new Map<number, Promise<CardShard>>()
const byName = new Map<string, CardDefinition>()

/** Bumped as each shard arrives, so a component that read `peekCard` before
 * it did renders again (`useCardData`). */
let version = 0
const listeners = new Set<() => void>()

function fetchShard(index: number): Promise<CardShard> {
  const loaded = shards.get(index)
  if (loaded !== undefined) return Promise.resolve(loaded)
  let pending = inFlight.get(index)
  if (pending === undefined) {
    pending = loadCardShard(index).then(
      (shard) => {
        for (const def of shard.pool) byName.set(def.name, def)
        for (const def of shard.tokens) byName.set(def.name, def)
        shards.set(index, shard)
        inFlight.delete(index)
        version++
        for (const listener of listeners) listener()
        return shard
      },
      (error: unknown) => {
        inFlight.delete(index)
        throw error
      },
    )
    inFlight.set(index, pending)
  }
  return pending
}

/**
 * The definition named `name`, if its shard is in: the card, or `null` when
 * the pool has no card by that name. `undefined` means its shard hasn't
 * loaded yet — ask with `loadCard` or `requestCards`.
 */
export function peekCard(name: string): CardDefinition | null | undefined {
  const def = byName.get(name)
  if (def !== undefined) return def
  return shards.has(cardShardOf(name)) ? null : undefined
}

/** The definition named `name`, fetching its shard first if need be. `null`
 * when the pool has no such card, or its shard couldn't be fetched. */
export async function loadCard(name: string): Promise<CardDefinition | null> {
  try {
    await fetchShard(cardShardOf(name))
  } catch {
    return null
  }
  return byName.get(name) ?? null
}

/** Starts fetching the shards `names` are in, without waiting for them. */
export function requestCards(names: Iterable<string>): void {
  for (const name of names) void loadCard(name)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const currentVersion = () => version

/**
 * `peekCard`, for a component that renders what it finds: the component
 * renders again as each shard arrives, so a card that wasn't loaded the first
 * time shows up once it is. Reading fetches nothing; pair it with
 * `requestCards` for the names the component shows.
 */
export function useCardData(): (name: string) => CardDefinition | null | undefined {
  useSyncExternalStore(subscribe, currentVersion)
  return peekCard
}

/** Every card and token, for the pages that work over all of them. */
export interface CardPool {
  /** Every definition under `pool/`, by name. Each face of a double-faced
   * card is its own definition, as in `POOL_CARDS`. */
  readonly cards: readonly CardDefinition[]
  /** Every token definition, by name. */
  readonly tokens: readonly CardDefinition[]
  /** Every card and token, by name. */
  readonly byName: ReadonlyMap<string, CardDefinition>
  /** A registry of every card and token, which is what the engine's deck
   * rules (`validateCommanderDeck`, `canPairCommanders`) read. */
  readonly registry: CardRegistry
}

let pool: CardPool | null = null
let poolPending: Promise<CardPool> | null = null

/** Fetches every shard, in parallel, and assembles the pool. */
export function loadCardPool(): Promise<CardPool> {
  if (pool !== null) return Promise.resolve(pool)
  poolPending ??= Promise.all(
    Array.from({ length: CARD_SHARD_COUNT }, (_, i) => fetchShard(i)),
  ).then(
    (loaded) => {
      const alphabetical = (a: CardDefinition, b: CardDefinition) => a.name.localeCompare(b.name)
      const cards = loaded.flatMap((shard) => shard.pool).sort(alphabetical)
      const tokens = loaded.flatMap((shard) => shard.tokens).sort(alphabetical)
      const registry = new CardRegistry()
      for (const def of cards) registry.register(def)
      for (const def of tokens) registry.register(def)
      pool = { cards, tokens, byName, registry }
      return pool
    },
    (error: unknown) => {
      poolPending = null
      throw error
    },
  )
  return poolPending
}

/**
 * The whole pool, once `loadCardPool` has assembled it. The library and the
 * deck builder render only after it has (see `main.tsx`), so they read it
 * from here rather than having it threaded through every component.
 */
export function cardPool(): CardPool {
  if (pool === null) throw new Error('cardPool() was read before loadCardPool() finished')
  return pool
}

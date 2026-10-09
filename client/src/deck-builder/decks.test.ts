import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listDecks } from './decks.ts'

const DECKS_KEY = 'mtg-engine:decks'

/** A `localStorage` that counts its writes. */
function fakeStorage() {
  const items = new Map<string, string>()
  let writes = 0
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes++
      items.set(key, value)
    },
    removeItem: (key: string) => void items.delete(key),
    get writes() {
      return writes
    },
  }
}

describe('saved-deck migrations', () => {
  let storage: ReturnType<typeof fakeStorage>
  beforeEach(() => {
    storage = fakeStorage()
    vi.stubGlobal('window', { localStorage: storage })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const stored = () => JSON.parse(storage.getItem(DECKS_KEY) ?? 'null') as unknown

  it('writes a deck with a lone commander back as a commanders list, once', () => {
    storage.setItem(DECKS_KEY, JSON.stringify([{ id: 'a', name: 'Old', commander: 'Edgar Markov', cards: [] }]))
    const before = storage.writes

    expect(listDecks()).toEqual([{ id: 'a', name: 'Old', commanders: ['Edgar Markov'], cards: [] }])
    expect(stored()).toEqual([{ id: 'a', name: 'Old', commanders: ['Edgar Markov'], cards: [] }])
    expect(storage.writes).toBe(before + 1)

    // Already migrated: the next read has nothing to write.
    listDecks()
    expect(storage.writes).toBe(before + 1)
  })

  it('writes a card held under its flavor name back under its own name', () => {
    storage.setItem(
      DECKS_KEY,
      JSON.stringify([
        {
          id: 'a',
          name: 'Flavor',
          commanders: ['Princess Sarah'],
          cards: ['Princess Sarah', 'Forest'],
          printings: { 'Princess Sarah': 'abc' },
        },
      ]),
    )
    listDecks()
    expect(stored()).toEqual([
      {
        id: 'a',
        name: 'Flavor',
        commanders: ['Azusa, Lost but Seeking'],
        cards: ['Azusa, Lost but Seeking', 'Forest'],
        printings: { 'Azusa, Lost but Seeking': 'abc' },
      },
    ])
  })

  it('writes nothing when every deck is already in the current shape', () => {
    storage.setItem(DECKS_KEY, JSON.stringify([{ id: 'a', name: 'New', commanders: [], cards: ['Forest'] }]))
    const before = storage.writes
    expect(listDecks()).toEqual([{ id: 'a', name: 'New', commanders: [], cards: ['Forest'] }])
    expect(storage.writes).toBe(before)
  })
})

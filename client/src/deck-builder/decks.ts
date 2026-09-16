/**
 * Local (per-browser) deck persistence — no server-side save/share yet, that's
 * the separate, later roadmap item (see `docs/plans/`). A small named-deck
 * list in `localStorage`, plus a reference to whichever deck is "active":
 * the one `useNetworkGame` sends along when creating or claiming a seat in a
 * room (see `getActivePayload`). `localStorage`, not `sessionStorage` — a
 * deck someone's building should survive closing the tab, unlike a room seat
 * claim.
 *
 * "Active" can point at one of the player's own saved decks *or* directly at
 * one of `engine`'s `SAMPLE_DECKS` (the curated starter decks) — playing a
 * starter deck as-is shouldn't require duplicating it into "my decks" first.
 */

import { SAMPLE_DECKS } from 'engine'

export interface SavedDeck {
  readonly id: string;
  readonly name: string;
  readonly commander?: string;
  readonly cards: readonly string[];
}

export type ActiveRef = { readonly kind: 'saved'; readonly id: string } | { readonly kind: 'starter'; readonly index: number }

const DECKS_KEY = 'mtg-engine:decks'
const ACTIVE_KEY = 'mtg-engine:active-deck'

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

/** Wraps every `localStorage` access — a private window or blocked site data
 * throws on read/write, in which case decks just don't persist rather than
 * breaking the builder (same convention as `useNetworkGame.ts`'s
 * `sessionStorage` helpers). */
function readDecks(): SavedDeck[] {
  try {
    const raw = window.localStorage.getItem(DECKS_KEY)
    return raw ? (JSON.parse(raw) as SavedDeck[]) : []
  } catch {
    return []
  }
}

function writeDecks(decks: readonly SavedDeck[]): void {
  try {
    window.localStorage.setItem(DECKS_KEY, JSON.stringify(decks))
  } catch {
    // ignore — see readDecks
  }
}

export function listDecks(): SavedDeck[] {
  return readDecks()
}

export function getDeck(id: string): SavedDeck | null {
  return readDecks().find((d) => d.id === id) ?? null
}

/** Creates a new, empty deck (no commander, no cards) and makes it active. */
export function createDeck(name: string): SavedDeck {
  const deck: SavedDeck = { id: newId(), name, cards: [] }
  writeDecks([...readDecks(), deck])
  setActive({ kind: 'saved', id: deck.id })
  return deck
}

/** Same as `createDeck`, but pre-populated — for the deck builder's decklist
 * import flow, once it's resolved a final card list (implemented cards
 * as-is, an already-implemented stand-in for anything the engine doesn't
 * have yet). */
export function createDeckFromImport(
  name: string,
  cards: readonly string[],
  commander?: string,
): SavedDeck {
  const deck: SavedDeck = { id: newId(), name, cards, commander }
  writeDecks([...readDecks(), deck])
  setActive({ kind: 'saved', id: deck.id })
  return deck
}

/** Upserts by id — the builder calls this on every edit (add/remove a card,
 * set the commander, rename). */
export function saveDeck(deck: SavedDeck): void {
  const decks = readDecks()
  const i = decks.findIndex((d) => d.id === deck.id)
  if (i === -1) writeDecks([...decks, deck])
  else writeDecks(decks.map((d, j) => (j === i ? deck : d)))
}

export function deleteDeck(id: string): void {
  writeDecks(readDecks().filter((d) => d.id !== id))
  const active = getActiveRef()
  if (active?.kind === 'saved' && active.id === id) setActive(null)
}

/** Copies a saved deck, or one of the read-only starter decks (`fromStarter`
 * index), into a new editable entry in "my decks". */
export function duplicateDeck(id: string): SavedDeck | null {
  const source = getDeck(id)
  if (source === null) return null
  const copy: SavedDeck = { ...source, id: newId(), name: `${source.name} (copy)` }
  writeDecks([...readDecks(), copy])
  return copy
}

export function duplicateStarter(index: number): SavedDeck | null {
  const source = SAMPLE_DECKS[index]
  if (source === undefined) return null
  const copy: SavedDeck = {
    id: newId(),
    name: `${source.name} (copy)`,
    commander: source.commander,
    cards: source.cards,
  }
  writeDecks([...readDecks(), copy])
  return copy
}

export function getActiveRef(): ActiveRef | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY)
    return raw ? (JSON.parse(raw) as ActiveRef) : null
  } catch {
    return null
  }
}

export function setActive(ref: ActiveRef | null): void {
  try {
    if (ref === null) window.localStorage.removeItem(ACTIVE_KEY)
    else window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(ref))
  } catch {
    // ignore — see readDecks
  }
}

/** The active deck's display name + card data, regardless of whether it's a
 * saved deck or a starter — `null` when nothing's active or the active
 * reference no longer resolves (a deleted saved deck). */
export function getActiveDeck(): { readonly name: string; readonly commander?: string; readonly cards: readonly string[] } | null {
  const ref = getActiveRef()
  if (ref === null) return null
  if (ref.kind === 'starter') return SAMPLE_DECKS[ref.index] ?? null
  return getDeck(ref.id)
}

/** What `useNetworkGame.claimSeat`/`addBot`/`setBotDeck` send over the wire —
 * `undefined` when no deck is active (or it's empty), so the server falls
 * back to that seat's positional starter deck (see
 * `server/src/pending-room.ts`). */
export function getActivePayload():
  | { readonly cards: readonly string[]; readonly commander?: string; readonly name: string }
  | undefined {
  const deck = getActiveDeck()
  if (deck === null || deck.cards.length === 0) return undefined
  return { cards: deck.cards, commander: deck.commander, name: deck.name }
}

/** One pickable option in the seat-picker's deck-choice popup — a saved deck
 * or one of `engine`'s starters, normalized to the same shape. `key` is
 * stable for React lists; `ref` is what selecting it should persist as
 * "active" (a saved deck only — picking a starter for someone *else's* seat,
 * a bot, shouldn't change what *you'd* bring if you later join yourself). */
export interface PickableDeck {
  readonly key: string
  readonly ref: ActiveRef | null
  readonly name: string
  readonly commander?: string
  readonly cards: readonly string[]
}

/** Every deck the seat-picker's popup can offer: this browser's saved decks,
 * then the four starters — in that order, since a saved deck is more likely
 * to be what someone actually wants to bring than a generic starter. */
export function listPickableDecks(): readonly PickableDeck[] {
  return [
    ...readDecks().map((d) => ({
      key: `saved:${d.id}`,
      ref: { kind: 'saved', id: d.id } as ActiveRef,
      name: d.name,
      commander: d.commander,
      cards: d.cards,
    })),
    ...SAMPLE_DECKS.map((d, i) => ({
      key: `starter:${i}`,
      ref: { kind: 'starter', index: i } as ActiveRef,
      name: d.name,
      commander: d.commander,
      cards: d.cards,
    })),
  ]
}

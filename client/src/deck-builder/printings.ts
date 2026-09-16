/**
 * Every printing of a card, from Scryfall — what the deck builder's
 * "Change printing…" picker offers.
 *
 * A direct browser call, like the art lookups in `ui/art.ts` and unlike the
 * decklist import, which goes through the server (`POST /import-deck`). The
 * import needs the server because it resolves a hundred names at once under
 * Scryfall's rate limit and then runs engine-side scoring on the result;
 * this is one search, for one card, when someone opens a menu. Routing it
 * through the room server would only add a hop — and the deck builder is
 * deliberately usable with no room server running at all.
 */

/** One printing offered by the picker — the fields it actually shows. */
export interface Printing {
  /** Scryfall card id. This is what a deck stores, and the only form the
   * server accepts over the wire (see `assertPrintingsAreSafe`). */
  readonly id: string
  readonly set: string
  readonly setName: string
  readonly collectorNumber: string
  readonly releasedAt: string
  readonly artist: string | null
  /** A small card image for the picker grid, or `null` if this printing has
   * none (rare, but Scryfall does carry placeholder-less entries). */
  readonly image: string | null
}

export interface PrintingPage {
  readonly printings: readonly Printing[]
  /** Scryfall's own next-page URL, or `null` at the end of the results. */
  readonly nextPage: string | null
  readonly total: number
}

interface ScryfallSearchCard {
  readonly id: string
  readonly set: string
  readonly set_name?: string
  readonly collector_number: string
  readonly released_at?: string
  readonly artist?: string
  readonly image_uris?: { readonly normal?: string; readonly small?: string }
  readonly card_faces?: readonly {
    readonly image_uris?: { readonly normal?: string; readonly small?: string }
  }[]
}

interface ScryfallSearchResponse {
  readonly data?: readonly ScryfallSearchCard[]
  readonly next_page?: string
  readonly total_cards?: number
}

const SEARCH_ENDPOINT = 'https://api.scryfall.com/cards/search'

function toPrinting(card: ScryfallSearchCard): Printing {
  const images = card.image_uris ?? card.card_faces?.[0]?.image_uris
  return {
    id: card.id,
    set: card.set.toUpperCase(),
    setName: card.set_name ?? card.set.toUpperCase(),
    collectorNumber: card.collector_number,
    releasedAt: card.released_at ?? '',
    artist: card.artist ?? null,
    image: images?.normal ?? images?.small ?? null,
  }
}

async function get(url: string): Promise<PrintingPage | null> {
  const res = await fetch(url)
  // 404 is Scryfall's "no cards matched", not a transport failure — the
  // caller retries with a looser query rather than surfacing an error.
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Scryfall returned ${res.status}`)
  const data = (await res.json()) as ScryfallSearchResponse
  const cards = data.data ?? []
  if (cards.length === 0) return null
  return {
    printings: cards.map(toPrinting),
    nextPage: data.next_page ?? null,
    total: data.total_cards ?? cards.length,
  }
}

function searchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    unique: 'prints',
    order: 'released',
    dir: 'desc',
  })
  return `${SEARCH_ENDPOINT}?${params.toString()}`
}

/** name → its first page of printings. Kept for the life of the page: a card's
 * printings don't change while someone is building a deck, and reopening the
 * same card's picker is the common case. */
const cache = new Map<string, PrintingPage>()

/**
 * Every printing of `cardName`, newest first. Scryfall pages at 175 results,
 * which only a basic land ever exceeds — `nextPage` carries the rest, for
 * {@link fetchMorePrintings}.
 *
 * Tries the exact-name operator first and falls back to a plain name search,
 * because `!"…"` matches a card's *full* name: for a double-faced card the
 * engine's front-face name ("Bloodline Keeper") is only half of Scryfall's
 * ("Bloodline Keeper // Lord of Lineage"), and whether the exact operator
 * forgives that isn't something to depend on.
 */
export async function fetchPrintings(cardName: string): Promise<PrintingPage> {
  const cached = cache.get(cardName)
  if (cached) return cached
  const exact = await get(searchUrl(`!"${cardName}"`))
  const page = exact ?? (await get(searchUrl(`name:"${cardName}"`)))
  if (page === null) throw new Error(`Scryfall has no printings for "${cardName}"`)
  cache.set(cardName, page)
  return page
}

/** The next page of a result whose `nextPage` isn't null. Not cached — paging
 * deeper than the first 175 only happens for a basic land someone is actively
 * scrolling through. */
export async function fetchMorePrintings(nextPage: string): Promise<PrintingPage> {
  const page = await get(nextPage)
  if (page === null) throw new Error('Scryfall returned no further printings')
  return page
}

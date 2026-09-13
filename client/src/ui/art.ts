/**
 * Resolves a card's art image URL.
 *
 * By default the client asks Scryfall for a card's art *by name*
 * (`api.scryfall.com/cards/named?exact=…&format=image`), which costs a real
 * card-name lookup **plus** a 302 redirect to the actual CDN file — two
 * round trips per card, one per `<img>` tag, against the same 10 req/sec
 * budget the JSON API shares. `queueArtLookup`/`subscribeArtCache` below let
 * a caller (see `CardTile.tsx`) batch those lookups instead: every name
 * queued in the same tick is folded into one `POST /cards/collection` call
 * (up to 75 identifiers), and the resulting `image_uris` are cached so
 * `resolveArtUrl` can return a direct CDN URL — no redirect — once resolved.
 * Until a name resolves (or if the batch fetch fails), the by-name fallback
 * still renders something, so nothing regresses.
 *
 * A card can also override art entirely with a `CardDefinition.art` link
 * pinning a specific printing — pasted straight from a browser, the Scryfall
 * API, or a direct image host. No lookup happens for that path; a page/API
 * URL is rewritten to Scryfall's image endpoint, which still 302s (these are
 * rare, one-off overrides, not worth batching).
 */

export type ArtVersion = 'art_crop' | 'normal' | 'large' | 'png'

/** The by-name lookup — Scryfall serves art for any real card name from here. */
function byNameUrl(name: string, version: ArtVersion): string {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
    name,
  )}&format=image&version=${version}`
}

interface ScryfallImageUris {
  readonly small?: string
  readonly normal?: string
  readonly large?: string
  readonly png?: string
  readonly art_crop?: string
  readonly border_crop?: string
}

interface ScryfallCollectionFace {
  readonly name?: string
  readonly flavor_name?: string
  readonly image_uris?: ScryfallImageUris
}

interface ScryfallCollectionCard extends ScryfallCollectionFace {
  readonly card_faces?: readonly ScryfallCollectionFace[]
}

interface ScryfallCollectionResponse {
  readonly data?: readonly ScryfallCollectionCard[]
}

/** name/flavor_name (lowercased) -> that printing's image URLs. Populated
 * only via `queueArtLookup`'s batched fetch; never cleared (art doesn't
 * change mid-session, and a redeploy reloads the page). */
const imageCache = new Map<string, ScryfallImageUris>()
const pendingNames = new Set<string>()
const pendingKeys = new Set<string>()
const inFlightKeys = new Set<string>()
const listeners = new Set<() => void>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
let cacheVersion = 0

const COLLECTION_ENDPOINT = 'https://api.scryfall.com/cards/collection'
const COLLECTION_BATCH_SIZE = 75
// Small enough that a batch still goes out promptly; large enough that every
// CardTile mounted/updated in the same React commit gets folded into it.
const FLUSH_DEBOUNCE_MS = 30

function notify(): void {
  cacheVersion += 1
  for (const listener of listeners) listener()
}

/** Subscribe to art-cache updates (for `useSyncExternalStore`). */
export function subscribeArtCache(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getArtCacheVersion(): number {
  return cacheVersion
}

function storeImages(name: string | undefined, images: ScryfallImageUris | undefined): void {
  if (!name || !images) return
  const key = name.toLowerCase()
  if (!imageCache.has(key)) imageCache.set(key, images)
}

function applyCard(card: ScryfallCollectionCard): void {
  const primary = card.image_uris ?? card.card_faces?.[0]?.image_uris
  storeImages(card.name, primary)
  storeImages(card.flavor_name, primary)
  for (const face of card.card_faces ?? []) {
    storeImages(face.name, face.image_uris ?? primary)
    storeImages(face.flavor_name, face.image_uris ?? primary)
  }
}

async function flushPending(): Promise<void> {
  if (pendingNames.size === 0) return
  const names = [...pendingNames]
  pendingNames.clear()
  pendingKeys.clear()
  for (const n of names) inFlightKeys.add(n.toLowerCase())

  let changed = false
  for (let i = 0; i < names.length; i += COLLECTION_BATCH_SIZE) {
    const chunk = names.slice(i, i + COLLECTION_BATCH_SIZE)
    try {
      const res = await fetch(COLLECTION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: chunk.map((name) => ({ name })) }),
      })
      if (res.ok) {
        const data = (await res.json()) as ScryfallCollectionResponse
        for (const card of data.data ?? []) {
          applyCard(card)
          changed = true
        }
      }
    } catch {
      // Best-effort — the by-name <img> fallback still renders the card.
    } finally {
      for (const n of chunk) inFlightKeys.delete(n.toLowerCase())
    }
  }
  if (changed) notify()
}

function scheduleFlush(): void {
  if (flushTimer !== null) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushPending()
  }, FLUSH_DEBOUNCE_MS)
}

/**
 * Queues a card name for the next batched `/cards/collection` art lookup.
 * A no-op if the name is already cached, queued, or in flight. Call this
 * from an effect (not during render) — see `CardTile.tsx`.
 */
export function queueArtLookup(name: string): void {
  const key = name.toLowerCase()
  if (imageCache.has(key) || pendingKeys.has(key) || inFlightKeys.has(key)) return
  pendingNames.add(name)
  pendingKeys.add(key)
  scheduleFlush()
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** `scryfall.com/card/{set}/{collector}[/slug]` — the browser address-bar URL. */
const PAGE_RE = /^https?:\/\/(?:www\.)?scryfall\.com\/card\/([^/]+)\/([^/]+)/i
/** `api.scryfall.com/cards/{set}/{num}` or `api.scryfall.com/cards/{uuid}`. */
const API_RE = /^https?:\/\/api\.scryfall\.com\/cards\/(.+?)(?:\?|$)/i

function withImageParams(base: string, version: ArtVersion): string {
  return `${base}?format=image&version=${version}`
}

/**
 * @param art the card's `art` field (`null` ⇒ fall back to the by-name lookup)
 * @param name the card / face name, for the fallback
 */
export function resolveArtUrl(
  art: string | null | undefined,
  name: string,
  version: ArtVersion = 'art_crop',
): string {
  if (!art) {
    const cached = imageCache.get(name.toLowerCase())?.[version]
    return cached ?? byNameUrl(name, version)
  }
  const trimmed = art.trim()

  if (UUID_RE.test(trimmed)) {
    return withImageParams(`https://api.scryfall.com/cards/${trimmed}`, version)
  }

  const page = PAGE_RE.exec(trimmed)
  if (page) {
    const [, set, collector] = page
    return withImageParams(
      `https://api.scryfall.com/cards/${set.toLowerCase()}/${collector}`,
      version,
    )
  }

  const api = API_RE.exec(trimmed)
  if (api) {
    return withImageParams(`https://api.scryfall.com/cards/${api[1]}`, version)
  }

  // A direct image URL (cards.scryfall.io/…) or anything else — use as given.
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  // Unrecognised — safest to fall back rather than emit a broken <img src>.
  return byNameUrl(name, version)
}

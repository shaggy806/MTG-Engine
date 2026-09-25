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
 * `isArtPending` has `CardTile.tsx`/`MiniTile.tsx` hold off rendering the
 * `<img>` at all while a name's batch lookup is in flight or retrying, so a
 * big board's first render fires one POST instead of one by-name request per
 * permanent; once the batch gives up (a few backed-off retries, e.g. through
 * a Scryfall maintenance blip) or was never queued, the by-name fallback
 * renders something so nothing regresses.
 *
 * A card can also override art entirely with a `CardDefinition.art` link
 * pinning a specific printing — pasted straight from a browser, the Scryfall
 * API, or a direct image host. No lookup happens for that path; a page/API
 * URL is rewritten to Scryfall's image endpoint, which still 302s (these are
 * rare, one-off overrides, not worth batching).
 */

export type ArtVersion = 'art_crop' | 'normal' | 'large' | 'png'

/** `Math.min(1000 * 2 ** attempt, 20000)` — shared backoff curve for both the
 * batched collection lookup and a bare `<img>`'s own retries: 2s, 4s, 8s,
 * 16s, capped at 20s. */
function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 20000)
}

/** An `<img>` load that failed this session, with a bounded, backed-off
 * retry instead of a permanent block — a real card's art can 404 or time out
 * transiently (Scryfall rate-limiting a burst of simultaneous requests when a
 * big board first renders, or a maintenance blip), and treating that as
 * permanent left an arbitrary subset of perfectly real cards blank for the
 * rest of the session. After `MAX_IMG_ATTEMPTS` failures (a name that
 * genuinely doesn't resolve — a made-up card, a token with no `art`
 * override) it does give up for good. Shared by `CardTile.tsx` and
 * `MiniTile.tsx`, which can both render the same battlefield object (full
 * detail vs. a hover popover) and would otherwise track the same failure
 * twice. */
const imgFailures = new Map<string, { count: number; nextRetryAt: number }>()
const MAX_IMG_ATTEMPTS = 4

/** True while `url` is either blocked (out of retries) or still cooling down
 * from a prior failure — callers should skip rendering the `<img>` and wait. */
export function isArtBlocked(url: string): boolean {
  const rec = imgFailures.get(url)
  if (!rec) return false
  return rec.count >= MAX_IMG_ATTEMPTS || Date.now() < rec.nextRetryAt
}

/** Record an `<img onError>` for `url` and schedule a cache-version bump (a
 * global re-render, same as a batch resolving) once its backoff elapses, so
 * a component that skipped rendering because `isArtBlocked` was true gets a
 * chance to try again. */
export function recordArtFailure(url: string): void {
  const rec = imgFailures.get(url) ?? { count: 0, nextRetryAt: 0 }
  rec.count += 1
  if (rec.count < MAX_IMG_ATTEMPTS) {
    const delay = backoffMs(rec.count)
    rec.nextRetryAt = Date.now() + delay
    imgFailures.set(url, rec)
    setTimeout(notify, delay + 50)
  } else {
    imgFailures.set(url, rec)
  }
  notify() // immediate re-render so every tile showing this URL hides it now
}

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
  readonly not_found?: readonly { readonly name?: string }[]
}

/** name/flavor_name (lowercased) -> that printing's image URLs. Populated
 * via `queueArtLookup`'s batched fetch, and seeded from `localStorage` at
 * load (see `loadPersistedImages`); never cleared mid-session. */
const imageCache = new Map<string, ScryfallImageUris>()

/**
 * The lookup cache outlives the page. Every visit used to start empty, so
 * opening the card library meant re-asking Scryfall for every card's image
 * URLs — several `/cards/collection` round-trips — before a single face could
 * render, even though the images themselves were already in the browser's
 * HTTP cache. Only the name → URL mapping is stored (a few hundred bytes a
 * card); the image bytes stay the browser's business.
 *
 * Entries expire after `PERSIST_TTL_MS` so a re-scanned or re-pointed image
 * is picked up eventually, and the store is capped at `PERSIST_MAX_ENTRIES`
 * (oldest dropped) so a long history of imports can't grow it without bound.
 * Storage that's blocked, full or corrupt just means a cold start, as before.
 */
const PERSIST_KEY = 'mtg-engine:art-cache:v1'
const PERSIST_TTL_MS = 14 * 24 * 60 * 60 * 1000
const PERSIST_MAX_ENTRIES = 4000
const PERSIST_DEBOUNCE_MS = 1000
/** The versions any caller asks `resolveArtUrl` for — the rest aren't worth
 * the storage. */
const PERSISTED_VERSIONS = ['art_crop', 'normal', 'large', 'png'] as const

interface PersistedImages {
  readonly savedAt: number
  /** key -> [savedAt, image URLs] */
  readonly entries: Readonly<Record<string, readonly [number, ScryfallImageUris]>>
}

/** When each cached key was fetched (or restored), for expiry on save. */
const imageSavedAt = new Map<string, number>()
let persistTimer: ReturnType<typeof setTimeout> | null = null

function loadPersistedImages(): void {
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY)
    if (!raw) return
    const stored = JSON.parse(raw) as PersistedImages
    const cutoff = Date.now() - PERSIST_TTL_MS
    for (const [key, [savedAt, images]] of Object.entries(stored.entries ?? {})) {
      if (savedAt < cutoff || imageCache.has(key)) continue
      imageCache.set(key, images)
      imageSavedAt.set(key, savedAt)
    }
  } catch {
    // Unreadable or blocked: start cold.
  }
}

function persistImagesSoon(): void {
  if (persistTimer !== null) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      const cutoff = Date.now() - PERSIST_TTL_MS
      const live = [...imageSavedAt]
        .filter(([, savedAt]) => savedAt >= cutoff)
        .sort((a, b) => b[1] - a[1])
        .slice(0, PERSIST_MAX_ENTRIES)
      const entries: Record<string, readonly [number, ScryfallImageUris]> = {}
      for (const [key, savedAt] of live) {
        const images = imageCache.get(key)
        if (!images) continue
        const slim: Record<string, string> = {}
        for (const v of PERSISTED_VERSIONS) {
          const url = images[v]
          if (url) slim[v] = url
        }
        entries[key] = [savedAt, slim]
      }
      const payload: PersistedImages = { savedAt: Date.now(), entries }
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(payload))
    } catch {
      // Full or blocked storage — the in-memory cache still serves this visit.
    }
  }, PERSIST_DEBOUNCE_MS)
}

if (typeof window !== 'undefined') loadPersistedImages()
const pendingNames = new Set<string>()
const pendingKeys = new Set<string>()
const inFlightKeys = new Set<string>()
/** Failed-batch-lookup attempt count per name key, so a Scryfall outage gets
 * a few backed-off retries before `isArtPending` gives up on it and lets the
 * eager by-name `<img>` fallback take over. */
const batchAttempts = new Map<string, number>()
/** Names the batch endpoint has either exhausted retries on, or told us
 * outright don't exist (`not_found`) — no point re-queuing either. */
const batchGaveUp = new Set<string>()
const MAX_BATCH_ATTEMPTS = 4
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
  if (!imageCache.has(key)) {
    imageCache.set(key, images)
    imageSavedAt.set(key, Date.now())
  }
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

/** Re-queue `names` for another batch attempt after a backoff, unless a name
 * has now hit `MAX_BATCH_ATTEMPTS` — those go to `batchGaveUp` instead so
 * `isArtPending` stops holding their `<img>` back and the by-name fallback
 * renders them. */
function retryOrGiveUp(names: readonly string[]): void {
  const toRetry: string[] = []
  let maxAttempt = 0
  for (const name of names) {
    const key = name.toLowerCase()
    const attempt = (batchAttempts.get(key) ?? 0) + 1
    batchAttempts.set(key, attempt)
    if (attempt >= MAX_BATCH_ATTEMPTS) {
      batchGaveUp.add(key)
    } else {
      toRetry.push(name)
      maxAttempt = Math.max(maxAttempt, attempt)
    }
  }
  if (toRetry.length === 0) {
    notify() // nothing left to retry — let held-back <img>s fall back now
    return
  }
  setTimeout(() => {
    for (const name of toRetry) {
      const key = name.toLowerCase()
      if (imageCache.has(key) || pendingKeys.has(key) || inFlightKeys.has(key)) continue
      pendingNames.add(name)
      pendingKeys.add(key)
    }
    scheduleFlush()
  }, backoffMs(maxAttempt))
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
    let failed = false
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
        // A name Scryfall itself doesn't recognize (typo, made-up card, a
        // token with no `art` override) won't start resolving on a retry —
        // give up on the batch path for it right away.
        for (const nf of data.not_found ?? []) {
          if (nf.name) batchGaveUp.add(nf.name.toLowerCase())
        }
      } else {
        failed = true
      }
    } catch {
      failed = true
    } finally {
      for (const n of chunk) inFlightKeys.delete(n.toLowerCase())
    }
    // A transient failure (rate limit, maintenance blip) — not a "this name
    // doesn't exist" — gets backed-off retries instead of being dropped, so
    // a Scryfall hiccup doesn't strand perfectly real cards without art for
    // the rest of the session.
    if (failed) retryOrGiveUp(chunk)
  }
  if (changed) {
    notify()
    persistImagesSoon()
  }
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
 * A no-op if the name is already cached, queued, or in flight. Deliberately
 * called during render (not from an effect) by `CardTile.tsx`/`MiniTile.tsx`
 * — an effect runs too late to stop that same render's `<img>` from already
 * having fired the eager by-name fallback; see `isArtPending`'s comment.
 * Idempotent, so calling it more than once for the same name is free.
 */
export function queueArtLookup(name: string): void {
  const key = name.toLowerCase()
  if (imageCache.has(key) || pendingKeys.has(key) || inFlightKeys.has(key)) return
  pendingNames.add(name)
  pendingKeys.add(key)
  scheduleFlush()
}

/**
 * True while `name`'s batched lookup is queued, in flight, or waiting out a
 * retry backoff — callers should hold off on the eager by-name `<img>`
 * fallback so a big board's first render doesn't fire one
 * `/cards/named?...&format=image` request per permanent at once (the actual
 * cause of Scryfall rate-limiting a chunk of an otherwise-real board). Once
 * the batch either resolves or gives up, this returns false and the by-name
 * fallback is fair game.
 */
export function isArtPending(name: string): boolean {
  const key = name.toLowerCase()
  if (imageCache.has(key) || batchGaveUp.has(key)) return false
  return pendingKeys.has(key) || inFlightKeys.has(key)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** `scryfall.com/card/{set}/{collector}[/slug]` — the browser address-bar URL. */
const PAGE_RE = /^https?:\/\/(?:www\.)?scryfall\.com\/card\/([^/]+)\/([^/]+)/i
/** `api.scryfall.com/cards/{set}/{num}` or `api.scryfall.com/cards/{uuid}`. */
const API_RE = /^https?:\/\/api\.scryfall\.com\/cards\/(.+?)(?:\?|$)/i

function withImageParams(base: string, version: ArtVersion, backFace: boolean): string {
  // `face=back` asks Scryfall's own card endpoint for the second printed
  // image — the only way to address a back face by card id, since an id
  // names the whole card and serves its front. 422 if the card has no back
  // face, hence the caller-side guard (`VisibleObject.faceIsBack`, which is
  // false for an adventure's spell half — same `faces` shape, one image).
  return `${base}?format=image&version=${version}${backFace ? '&face=back' : ''}`
}

/** Hosts an art URL may point at.
 *
 * Defence in depth around `CardDefinition.art`, which is authored in this
 * repo but is *also* where a deck's chosen printing lands after travelling
 * from another player's browser (`PlayerState.printings` → `viewFor`'s
 * `art`). The server already narrows that to a bare card id, but this
 * function is what turns a value into an `<img src>`, so it refuses to emit
 * a URL pointing anywhere else regardless of what reached it — an arbitrary
 * host here would mean every viewer's browser making a request that leaks
 * their IP address to whoever chose the value. */
const ALLOWED_ART_HOSTS: readonly string[] = [
  'api.scryfall.com',
  'cards.scryfall.io',
  'scryfall.com',
  'www.scryfall.com',
]

function hostIsAllowed(url: string): boolean {
  try {
    return ALLOWED_ART_HOSTS.includes(new URL(url).hostname.toLowerCase())
  } catch {
    return false
  }
}

/** A direct Scryfall CDN file — `cards.scryfall.io/{version}/{front|back}/…`.
 * The version is the first path segment, so a stored `art_crop` link can be
 * re-pointed at any other size rather than only ever serving the crop it was
 * pasted as. That matters for the DFC back faces, which are the only cards
 * whose `art` is a direct file (a back face has no by-name lookup of its
 * own): without this the library's flip showed a cropped illustration where
 * every other card showed a full card face. */
const CDN_FILE_RE =
  /^(https?:\/\/cards\.scryfall\.io\/)(small|normal|large|png|art_crop|border_crop)(\/.+)$/i

/**
 * Wraps a resolved art URL as a CSS `url()` value, for `background-image`.
 *
 * Not optional quoting: an unquoted `url()` token may not contain a quote
 * character, and `encodeURIComponent` deliberately leaves an apostrophe
 * alone — so the by-name lookup for a card like "Atraxa, Praetors' Voice"
 * produced a URL with a bare `'` in it, which made the whole declaration
 * invalid and silently dropped. Every card whose name has an apostrophe lost
 * its art this way; every other card looked fine.
 */
export function cssUrl(url: string): string {
  return `url("${url.replace(/[\\"]/g, '\\$&')}")`
}

export interface ArtOptions {
  /** The object is showing a card's *second printed image* — a transforming
   * DFC turned over, or an MDFC's other face (see `VisibleObject.faceIsBack`,
   * which the engine computes; an adventure has the same `faces` shape but
   * only one image, so it is never true there).
   *
   * Only honoured for a reference that names a whole card (an id, a page or
   * API link): a direct CDN file already spells out which face it is, and a
   * by-name lookup is already being made under the back face's own name. */
  readonly backFace?: boolean
}

/**
 * @param art the card's `art` field (`null` ⇒ fall back to the by-name lookup)
 * @param name the card / face name, for the fallback
 */
export function resolveArtUrl(
  art: string | null | undefined,
  name: string,
  version: ArtVersion = 'art_crop',
  opts: ArtOptions = {},
): string {
  const back = opts.backFace === true
  if (!art) {
    const cached = imageCache.get(name.toLowerCase())?.[version]
    return cached ?? byNameUrl(name, version)
  }
  const trimmed = art.trim()

  if (UUID_RE.test(trimmed)) {
    return withImageParams(`https://api.scryfall.com/cards/${trimmed}`, version, back)
  }

  const page = PAGE_RE.exec(trimmed)
  if (page) {
    const [, set, collector] = page
    return withImageParams(
      `https://api.scryfall.com/cards/${set.toLowerCase()}/${collector}`,
      version,
      back,
    )
  }

  const api = API_RE.exec(trimmed)
  if (api) {
    return withImageParams(`https://api.scryfall.com/cards/${api[1]}`, version, back)
  }

  // A direct Scryfall CDN file — re-point it at the requested size (a `png`
  // has a different extension, so that one is left as stored).
  const cdn = CDN_FILE_RE.exec(trimmed)
  if (cdn && version !== 'png' && cdn[2].toLowerCase() !== 'png') {
    return `${cdn[1]}${version}${cdn[3]}`
  }

  // Any other direct image URL — use as given, but only on a host we're
  // willing to send a viewer's browser to (see ALLOWED_ART_HOSTS).
  if (/^https?:\/\//i.test(trimmed) && hostIsAllowed(trimmed)) return trimmed

  // Unrecognised, or somewhere we won't fetch from — fall back rather than
  // emit a broken (or hostile) <img src>.
  return byNameUrl(name, version)
}

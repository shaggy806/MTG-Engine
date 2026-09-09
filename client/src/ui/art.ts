/**
 * Resolves a card's art image URL.
 *
 * By default the client asks Scryfall for a card's art *by name*
 * (`api.scryfall.com/cards/named?exact=…`). A card can override that with a
 * `CardDefinition.art` link pinning a specific printing — pasted straight from
 * a browser, the Scryfall API, or a direct image host. No lookup happens here;
 * a page/API URL is rewritten to Scryfall's image endpoint, which 302s to the
 * actual file.
 */

export type ArtVersion = 'art_crop' | 'normal' | 'large' | 'png'

/** The by-name lookup — Scryfall serves art for any real card name from here. */
function byNameUrl(name: string, version: ArtVersion): string {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
    name,
  )}&format=image&version=${version}`
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
  if (!art) return byNameUrl(name, version)
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

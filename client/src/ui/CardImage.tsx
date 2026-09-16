import { useSyncExternalStore } from 'react'
import type { CardDefinition } from 'engine'
import { isTokenCard } from 'engine'
import { Symbols } from './Symbols.tsx'
import {
  getArtCacheVersion,
  isArtBlocked,
  isArtPending,
  queueArtLookup,
  recordArtFailure,
  resolveArtUrl,
  subscribeArtCache,
  type ArtVersion,
} from './art.ts'
import './card-image.css'

/**
 * A card's *whole printed face* as a single image — the thing a Scryfall
 * search result is, and what the card library's grid is built from.
 *
 * Distinct from `CardTile`, which reassembles a card out of DOM (a title bar,
 * an art crop, a text box) because it has to overlay live game state on it —
 * taps, counters, damage, targeting highlights. Nothing here is a game
 * object, so the real card face is both prettier and cheaper.
 *
 * Art resolution is the same batched path `CardTile` uses (`queueArtLookup`
 * during render, hold the `<img>` back while the batch is in flight), so a
 * gallery of 380 cards costs a handful of `/cards/collection` POSTs rather
 * than one by-name request with a 302 per card. When there's no image to be
 * had — a token, which has no real printing to look up, or a lookup that ran
 * out of retries — it falls back to a card-shaped panel carrying the same
 * information the face would have, rather than a blank rectangle.
 */
export function CardImage({
  def,
  version = 'normal',
  className,
}: {
  readonly def: CardDefinition
  readonly version?: ArtVersion
  /** Extra classes on the wrapper (the card-shaped box, not the `<img>`). */
  readonly className?: string
}) {
  // Re-render when a batched lookup resolves, so the direct CDN URL replaces
  // the by-name fallback (and a name the batch gave up on stops being held).
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)

  // A token's name ("Soldier Token") isn't a name Scryfall knows — real token
  // printings are named for the creature alone, and only some of ours pin a
  // printing with `art`. Looking the rest up anyway cost a not-found batch
  // round plus four backed-off `<img>` retries each, all of which could only
  // ever end at the same fallback, so go there directly.
  const unlookupable = !def.art && isTokenCard(def)
  if (!def.art && !unlookupable) queueArtLookup(def.name)

  const pending = !def.art && !unlookupable && isArtPending(def.name)
  const src = resolveArtUrl(def.art, def.name, version)
  const failed = !pending && (unlookupable || isArtBlocked(src))

  const classes = ['card-image', pending || failed ? 'placeholder' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes}>
      {pending || failed ? (
        <CardImageFallback def={def} showDetail={failed} />
      ) : (
        <img
          src={src}
          alt={def.name}
          loading="lazy"
          decoding="async"
          onError={() => recordArtFailure(src)}
        />
      )}
    </span>
  )
}

/** The card-shaped stand-in. While a lookup is still in flight it's a bare
 * shimmer (the real face is about to land and swapping text for an image
 * would flash); once the lookup has actually failed it fills in with the
 * card's own printed characteristics, which is all a token ever gets. */
function CardImageFallback({
  def,
  showDetail,
}: {
  readonly def: CardDefinition
  readonly showDetail: boolean
}) {
  if (!showDetail) return <span className="card-image-shimmer" aria-hidden="true" />
  const typeLine =
    def.subtypes.length > 0
      ? `${def.types.join(' ')} — ${def.subtypes.join(' ')}`
      : def.types.join(' ')
  return (
    <span className="card-image-fallback">
      <span className="cif-title">
        <span className="cif-name">{def.name}</span>
        {def.manaCost ? <Symbols text={def.manaCost} /> : null}
      </span>
      <span className="cif-type">{typeLine}</span>
      {/* Rendered even when empty: it's the flexible row, so without it a
          vanilla token's P/T rode up under the type line instead of sitting
          in the bottom-right corner a real card puts it in. */}
      <span className="cif-text">
        <Symbols text={def.text} />
      </span>
      {def.power !== null && def.toughness !== null ? (
        <span className="cif-pt mono">
          {def.power}/{def.toughness}
        </span>
      ) : null}
      {def.loyalty !== null ? <span className="cif-pt mono">{def.loyalty}</span> : null}
    </span>
  )
}

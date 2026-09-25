import type { SeatCommander } from 'protocol'
import { PINNED_ART } from 'engine/client'
import { cssUrl, resolveArtUrl } from '../ui/art.ts'

/**
 * A deck's commander art in the lobby: one crop, or for a Partner pair the
 * same box split down the middle between the two, so a pair reads as one
 * deck rather than two. `className` is the box itself — its size and shape
 * differ between the seat board and the deck picker — and `blankClass` is
 * added when there's no art to draw at all.
 *
 * Drawn from names alone, with no card definition loaded: the lobby is the
 * first thing a player sees, and the card pool is fetched only by the pages
 * that need it (see `cards/cardData.ts`). The only art a definition holds is
 * the printing it pins, and `PINNED_ART` has those.
 */
export function CommanderArt({
  commanders,
  className,
  blankClass,
}: {
  readonly commanders: readonly SeatCommander[]
  readonly className: string
  readonly blankClass: string
}) {
  // The printing the deck brings, so the preview is the art that will
  // actually hit the table (see `SavedDeck.printings`).
  const urls = commanders
    .filter((c) => c.name.length > 0)
    .map((c) => resolveArtUrl(c.printing ?? PINNED_ART[c.name], c.name))
  if (urls.length === 0) return <span className={`${className} ${blankClass}`} />
  if (urls.length === 1) return <span className={className} style={{ backgroundImage: cssUrl(urls[0]) }} />
  return (
    <span className={`${className} commander-art-pair`}>
      {urls.map((url, i) => (
        <span key={i} className="commander-art-half" style={{ backgroundImage: cssUrl(url) }} />
      ))}
    </span>
  )
}

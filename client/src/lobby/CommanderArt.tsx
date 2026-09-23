import type { SeatCommander } from 'protocol'
import { findCardDef } from '../ui/defToVisible.ts'
import { cssUrl, resolveArtUrl } from '../ui/art.ts'

/**
 * A deck's commander art in the lobby: one crop, or for a Partner pair the
 * same box split down the middle between the two, so a pair reads as one
 * deck rather than two. `className` is the box itself — its size and shape
 * differ between the seat board and the deck picker — and `blankClass` is
 * added when there's no art to draw at all.
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
  const urls = commanders.flatMap((c) => {
    const def = findCardDef(c.name)
    // The printing the deck brings, so the preview is the art that will
    // actually hit the table (see `SavedDeck.printings`).
    return def ? [resolveArtUrl(c.printing ?? def.art, def.name)] : []
  })
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

import { useSyncExternalStore } from 'react'
import type { ObjectId } from 'engine/client'
import {
  getArtCacheVersion,
  isArtBlocked,
  isArtPending,
  queueArtLookup,
  recordArtFailure,
  resolveArtUrl,
  subscribeArtCache,
} from './art.ts'
import type { SeatClass } from '../format.ts'

/** A Curse attached to a player, as their panel shows it. */
export interface CurseOnPlayer {
  readonly id: ObjectId
  readonly name: string
  readonly art: string | null
  /** The Curse's controller's seat colour class and display name. */
  readonly controllerClass: SeatClass
  readonly controllerLabel: string
}

/**
 * A Curse on this player (rule 303.4 — "Enchant player"), as a chip in their
 * panel's header: the card's art in a ring of its controller's seat colour,
 * like a commander-damage chip. The Curse itself is a permanent on its
 * controller's board, where it's hovered, targeted and clicked like any
 * other; this is so the player it's on can be seen to be cursed, and by whom.
 */
export function CurseChip({ curse }: { readonly curse: CurseOnPlayer }) {
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)
  // Queued synchronously during render — see the comment in CardTile.tsx.
  if (!curse.art) queueArtLookup(curse.name)
  const pending = !curse.art && isArtPending(curse.name)
  const artSrc = resolveArtUrl(curse.art, curse.name, 'art_crop')
  const showArt = !pending && !isArtBlocked(artSrc)
  const title = `${curse.name} (${curse.controllerLabel}'s) is enchanting this player`
  return (
    <span className={`cmdr-dmg pp-curse ${curse.controllerClass}`} title={title} aria-label={title}>
      <span className="cmdr-dmg-art">
        {showArt ? <img src={artSrc} alt="" loading="lazy" onError={() => recordArtFailure(artSrc)} /> : null}
      </span>
      <span className="pp-curse-mark" aria-hidden="true">
        ✶
      </span>
    </span>
  )
}

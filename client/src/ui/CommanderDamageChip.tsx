import { useSyncExternalStore } from 'react'
import { COMMANDER_DAMAGE_LETHAL } from 'engine'
import type { CommanderDamage } from 'engine'
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

/** Commander damage from one commander at or past which the chip warns, then
 * alarms — 21 loses (rule 903.10a), and one more hit from a typical
 * commander gets there from 15. */
const WARN_AT = 15
const DANGER_AT = 18

/**
 * Combat damage one commander has dealt this player, as a compact badge in
 * their panel's header: the commander's art in a ring of its owner's seat
 * colour, and the running total. It reads amber from 15 and red from 18 of
 * the 21 that loses the game, so a player about to die to a commander is
 * visible from across the table without reading any numbers.
 *
 * One chip per *commander*, not per opponent — Partners are counted
 * separately (see the engine's `PlayerState.commanderDamageTaken`).
 */
export function CommanderDamageChip({
  damage,
  ownerClass,
  ownerLabel,
}: {
  readonly damage: CommanderDamage
  /** The commander's owner's seat colour class. */
  readonly ownerClass: SeatClass
  readonly ownerLabel: string
}) {
  useSyncExternalStore(subscribeArtCache, getArtCacheVersion, getArtCacheVersion)
  // Queued synchronously during render — see the comment in CardTile.tsx.
  if (!damage.art) queueArtLookup(damage.name)
  const pending = !damage.art && isArtPending(damage.name)
  const artSrc = resolveArtUrl(damage.art, damage.name, 'art_crop')
  const showArt = !pending && !isArtBlocked(artSrc)

  const level =
    damage.amount >= DANGER_AT ? ' danger' : damage.amount >= WARN_AT ? ' warn' : ''
  const left = COMMANDER_DAMAGE_LETHAL - damage.amount
  const title =
    `${damage.amount} combat damage from ${damage.name} (${ownerLabel}'s commander)` +
    (left > 0 ? ` — ${left} more loses` : '')

  return (
    <span className={`cmdr-dmg ${ownerClass}${level}`} title={title} aria-label={title}>
      <span className="cmdr-dmg-art">
        {showArt ? (
          <img src={artSrc} alt="" loading="lazy" onError={() => recordArtFailure(artSrc)} />
        ) : null}
      </span>
      <span className="cmdr-dmg-amount">{damage.amount}</span>
    </span>
  )
}

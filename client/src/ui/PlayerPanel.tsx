import type { ManaPool, PlayerId, PublicPlayerInfo } from 'engine'
import { playerLabel } from '../format.ts'
import type { SeatClass } from '../format.ts'

export interface PlayerPanelProps {
  readonly info: PublicPlayerInfo
  readonly seatClass: SeatClass
  readonly isActive: boolean
  readonly hasPriority: boolean
  /** Whether this seat's connection is currently live. `null` when unknown
   * (e.g. no room-level seat data yet). */
  readonly online?: boolean | null
  /** This player's own cards currently in the (shared) exile zone. */
  readonly exileSize?: number
  /** Opens a read-only viewer of this player's graveyard/exile/hand, if provided. */
  readonly onOpenGraveyard?: () => void
  readonly onOpenExile?: () => void
  readonly onOpenHand?: () => void
  readonly targetable?: boolean
  readonly onTargetClick?: () => void
}

const manaString = (pool: ManaPool): string => {
  const order: (keyof ManaPool)[] = ['W', 'U', 'B', 'R', 'G', 'C']
  const parts = order
    .filter((k) => (pool[k] ?? 0) > 0)
    .map((k) => `${pool[k]}{${k}}`)
  return parts.join(' ')
}

export function PlayerPanel({
  info,
  seatClass,
  isActive,
  hasPriority,
  online = null,
  exileSize = 0,
  onOpenGraveyard,
  onOpenExile,
  onOpenHand,
  targetable = false,
  onTargetClick,
}: PlayerPanelProps) {
  const mana = manaString(info.manaPool)
  const commanderDamage = Object.entries(info.commanderDamageTaken).filter(
    ([, amount]) => amount > 0,
  )
  const classes = [
    'player-panel',
    seatClass,
    isActive ? 'active' : '',
    hasPriority ? 'priority' : '',
    targetable ? 'targetable' : '',
    info.hasLost ? 'lost' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      onClick={targetable ? onTargetClick : undefined}
      role={targetable ? 'button' : undefined}
    >
      <div className="pp-head">
        {online === null ? null : (
          <span
            className={`pp-online-dot ${online ? 'online' : 'offline'}`}
            title={online ? 'connected' : 'disconnected'}
          />
        )}
        <span className="pp-name">{playerLabel(info.id)}</span>
        <span className="pp-life">{info.life}</span>
      </div>
      <div className="pp-zones">
        <button
          type="button"
          className="pp-zone-link"
          disabled={!onOpenHand}
          onClick={(e) => {
            e.stopPropagation()
            onOpenHand?.()
          }}
        >
          hand {info.handSize}
        </button>
        <span>library {info.librarySize}</span>
        <button
          type="button"
          className="pp-zone-link"
          disabled={!onOpenGraveyard}
          onClick={(e) => {
            e.stopPropagation()
            onOpenGraveyard?.()
          }}
        >
          graveyard {info.graveyardSize}
        </button>
        <button
          type="button"
          className="pp-zone-link"
          disabled={!onOpenExile}
          onClick={(e) => {
            e.stopPropagation()
            onOpenExile?.()
          }}
        >
          exile {exileSize}
        </button>
        <span>
          lands {info.landsPlayedThisTurn}/{1}
        </span>
      </div>
      {mana ? <div className="pp-mana">{mana}</div> : null}
      {commanderDamage.length > 0 ? (
        <div className="pp-commander-damage">
          {commanderDamage.map(([from, amount]) => (
            <span key={from}>
              {amount} cmdr dmg from {playerLabel(from as PlayerId)}
            </span>
          ))}
        </div>
      ) : null}
      {info.hasLost ? <div className="pp-lost">{info.lossReason}</div> : null}
    </div>
  )
}

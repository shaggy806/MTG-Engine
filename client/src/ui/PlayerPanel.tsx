import type { ManaPool, PublicPlayerInfo } from 'engine'
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
  targetable = false,
  onTargetClick,
}: PlayerPanelProps) {
  const mana = manaString(info.manaPool)
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
        <span>hand {info.handSize}</span>
        <span>library {info.librarySize}</span>
        <span>graveyard {info.graveyardSize}</span>
        <span>
          lands {info.landsPlayedThisTurn}/{1}
        </span>
      </div>
      {mana ? <div className="pp-mana">{mana}</div> : null}
      {info.hasLost ? <div className="pp-lost">{info.lossReason}</div> : null}
    </div>
  )
}

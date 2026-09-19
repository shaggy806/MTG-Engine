import type { ManaPool, PlayerId, PublicPlayerInfo } from 'engine'
import { playerLabel } from '../format.ts'
import type { SeatClass } from '../format.ts'
import type { SeatStatus } from '../net/protocol.ts'
import { CommanderDamageChip } from './CommanderDamageChip.tsx'
import { Symbols } from './Symbols.tsx'

export interface PlayerPanelProps {
  readonly info: PublicPlayerInfo
  readonly seatClass: SeatClass
  /** Any player's seat colour — for colouring commander damage by whose
   * commander dealt it. */
  readonly seatClassOf: (player: PlayerId) => SeatClass
  readonly isActive: boolean
  readonly hasPriority: boolean
  /** Whether this seat's connection is currently live. `null` when unknown
   * (e.g. no room-level seat data yet). */
  readonly online?: boolean | null
  /** For resolving this player's chosen display name, if any. */
  readonly seats?: readonly SeatStatus[]
  /** This player's own cards currently in the (shared) exile zone. */
  readonly exileSize?: number
  /** Won the highroll and went first this game. */
  readonly wentFirst?: boolean
  /** This player is the monarch (rule 720). */
  readonly isMonarch?: boolean
  /** Rules text of this player's emblems (rule 114), if any. */
  readonly emblemTexts?: readonly string[]
  /** Opens a read-only viewer of this player's graveyard/exile/hand, if provided. */
  readonly onOpenGraveyard?: () => void
  readonly onOpenExile?: () => void
  readonly onOpenHand?: () => void
  readonly targetable?: boolean
  readonly onTargetClick?: () => void
}

/** Past this many of one colour the pool stops repeating pips and writes the
 * count instead, so a ritual's worth of mana doesn't run off the panel. */
const MAX_REPEATED_PIPS = 5

/**
 * The floating mana pool as a `Symbols` string — one pip per mana, so it reads
 * like a mana cost ("{G}{G}{R}"), falling back to a count plus a single pip
 * once there's too much of one colour to spell out.
 */
const manaString = (pool: ManaPool): string => {
  const order: (keyof ManaPool)[] = ['W', 'U', 'B', 'R', 'G', 'C']
  return order
    .filter((k) => (pool[k] ?? 0) > 0)
    .map((k) => {
      const n = pool[k]
      return n > MAX_REPEATED_PIPS ? `${n}{${k}}` : `{${k}}`.repeat(n)
    })
    .join('')
}

export function PlayerPanel({
  info,
  seatClass,
  seatClassOf,
  isActive,
  hasPriority,
  online = null,
  seats,
  exileSize = 0,
  wentFirst = false,
  isMonarch = false,
  emblemTexts = [],
  onOpenGraveyard,
  onOpenExile,
  onOpenHand,
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
      // Read by AnimationLayer to find this player's panel as an attack
      // lunge's target — not used for anything React-owned.
      data-player-id={info.id}
    >
      <div className="pp-head">
        {online === null ? null : (
          <span
            className={`pp-online-dot ${online ? 'online' : 'offline'}`}
            title={online ? 'connected' : 'disconnected'}
          />
        )}
        <span className="pp-name">{playerLabel(info.id, seats)}</span>
        {wentFirst ? <span className="pp-went-first" title="Won the highroll, goes first">🎲</span> : null}
        {isMonarch ? <span className="pp-monarch" title="The monarch (rule 720)">👑</span> : null}
        {info.commanderDamageTaken.length > 0 ? (
          <span className="pp-cmdr-dmg">
            {info.commanderDamageTaken.map((d) => (
              <CommanderDamageChip
                key={d.commander}
                damage={d}
                ownerClass={seatClassOf(d.owner)}
                ownerLabel={playerLabel(d.owner, seats)}
              />
            ))}
          </span>
        ) : null}
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
      {mana ? (
        <div className="pp-mana" title="Mana pool">
          <Symbols text={mana} />
        </div>
      ) : null}
      {info.energy > 0 ? (
        <div className="pp-energy" title="Energy counters ({E} — rule 122)">
          ⚡ {info.energy}
        </div>
      ) : null}
      {emblemTexts.length > 0 ? (
        <div className="pp-emblems" title="Emblems (rule 114)">
          {emblemTexts.map((t, i) => (
            <span key={i}>🎗 {t}</span>
          ))}
        </div>
      ) : null}
      {info.hasLost ? <div className="pp-lost">{info.lossReason}</div> : null}
    </div>
  )
}

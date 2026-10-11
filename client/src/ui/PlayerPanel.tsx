import { POISON_LETHAL } from 'engine/client'
import type { ManaPool, PlayerId, PublicPlayerInfo } from 'engine/client'
import { playerLabel } from '../format.ts'
import type { SeatClass } from '../format.ts'
import type { SeatStatus } from 'protocol'
import { CommanderDamageChip } from './CommanderDamageChip.tsx'
import { CurseChip, type CurseOnPlayer } from './CurseChip.tsx'
import { Symbols } from './Symbols.tsx'
import { TargetedMark } from './TargetedMark.tsx'

export interface PlayerPanelProps {
  readonly info: PublicPlayerInfo
  readonly seatClass: SeatClass
  /** Any player's seat colour — for colouring commander damage by whose
   * commander dealt it. */
  readonly seatClassOf: (player: PlayerId) => SeatClass
  readonly isActive: boolean
  readonly hasPriority: boolean
  /** The game is waiting on this seat (another player's, never your own):
   * what it's doing, shown with animated dots — "scrying…", "thinking…"
   * (`game/waitingLabel.ts`). */
  readonly waiting?: string | null
  /** Whether this seat's connection is currently live. `null` when unknown
   * (e.g. no room-level seat data yet). */
  readonly online?: boolean | null
  /** A bot is playing this seat: it shows a robot rather than the online
   * dot, which for a bot (no connection) read as "disconnected". */
  readonly bot?: boolean
  /** For resolving this player's chosen display name, if any. */
  readonly seats?: readonly SeatStatus[]
  /** This player's own cards currently in the (shared) exile zone. */
  readonly exileSize?: number
  /** Went first this game: won the highroll, or the host picked them. */
  readonly wentFirst?: boolean
  /** This player is the monarch (rule 720). */
  readonly isMonarch?: boolean
  /** How many emblems (rule 114) this player has. */
  readonly emblemCount?: number
  /** The Auras attached to this player — Curses (rule 303.4). */
  readonly curses?: readonly CurseOnPlayer[]
  /** Opens a read-only viewer of this player's graveyard/exile/hand, if provided. */
  readonly onOpenGraveyard?: () => void
  readonly onOpenExile?: () => void
  readonly onOpenHand?: () => void
  readonly onOpenEmblems?: () => void
  readonly targetable?: boolean
  /** Picked in a decision still being built (a proliferate's players). */
  readonly selected?: boolean
  /** What on the stack targets this player (`Table`'s `aim`), or null: a
   * red frame round the panel and a "Targeted" chip beside the name. */
  readonly aimedBy?: string | null
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
  waiting = null,
  online = null,
  bot = false,
  seats,
  exileSize = 0,
  wentFirst = false,
  isMonarch = false,
  emblemCount = 0,
  curses = [],
  onOpenGraveyard,
  onOpenExile,
  onOpenHand,
  onOpenEmblems,
  targetable = false,
  selected = false,
  aimedBy = null,
  onTargetClick,
}: PlayerPanelProps) {
  const mana = manaString(info.manaPool)
  const poison = info.counters.poison ?? 0
  const experience = info.counters.experience ?? 0
  const classes = [
    'player-panel',
    seatClass,
    isActive ? 'active' : '',
    hasPriority ? 'priority' : '',
    targetable ? 'targetable' : '',
    selected ? 'selected' : '',
    aimedBy !== null ? 'aimed' : '',
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
        {bot ? (
          <span className="pp-bot" title="played by a bot" role="img" aria-label="bot">
            🤖
          </span>
        ) : online === null ? null : (
          <span
            className={`pp-online-dot ${online ? 'online' : 'offline'}`}
            title={online ? 'connected' : 'disconnected'}
          />
        )}
        <span className="pp-name">{playerLabel(info.id, seats)}</span>
        {waiting !== null ? (
          <span className="pp-waiting" role="status">
            {waiting}
            <span className="pp-waiting-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </span>
        ) : null}
        {aimedBy !== null ? (
          <span className="pp-aimed" title={`Targeted by ${aimedBy}`}>
            <TargetedMark by={aimedBy} inline />
            Targeted
          </span>
        ) : null}
        {/* Every counter the player has, beside the name — poison, energy,
            experience — rather than on a row of its own: they're read with
            the player, and a quadrant has no height to spare. */}
        {poison > 0 || info.energy > 0 || experience > 0 ? (
          <span className="pp-counters">
            {poison > 0 ? (
              <span className="pp-poison" title="Poison counters (ten lose the game — rule 704.5c)">
                ☠ {poison}/{POISON_LETHAL}
              </span>
            ) : null}
            {info.energy > 0 ? (
              <span className="pp-energy" title="Energy counters ({E} — rule 122)">
                ⚡ {info.energy}
              </span>
            ) : null}
            {experience > 0 ? (
              <span className="pp-experience" title="Experience counters (rule 122.1)">
                ✦ {experience} exp
              </span>
            ) : null}
          </span>
        ) : null}
        {wentFirst ? <span className="pp-went-first" title="Went first this game">🎲</span> : null}
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
        {curses.length > 0 ? (
          <span className="pp-curses">
            {curses.map((c) => (
              <CurseChip key={c.id} curse={c} />
            ))}
          </span>
        ) : null}
        <span className="pp-life">{info.life}</span>
      </div>
      <div className="pp-zones">
        <button
          type="button"
          className="pp-zone-link"
          // Read by AnimationLayer: flashes when this player discards, since
          // no one else's hand is drawn.
          data-hand-of={info.id}
          disabled={!onOpenHand}
          onClick={(e) => {
            e.stopPropagation()
            onOpenHand?.()
          }}
        >
          hand {info.handSize}
        </button>
        {/* The three counts a mill or an exile from the top moves: read by
            AnimationLayer, which runs them in step with the cards leaving. */}
        <span data-library-count-of={info.id}>library {info.librarySize}</span>
        <button
          type="button"
          className="pp-zone-link"
          data-graveyard-count-of={info.id}
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
          data-exile-count-of={info.id}
          disabled={!onOpenExile}
          onClick={(e) => {
            e.stopPropagation()
            onOpenExile?.()
          }}
        >
          exile {exileSize}
        </button>
        {/* Only once there's one: most games never make an emblem, and the
            row has no room for a zone that's always empty. */}
        {emblemCount > 0 ? (
          <button
            type="button"
            className="pp-zone-link"
            title="Emblems (rule 114)"
            disabled={!onOpenEmblems}
            onClick={(e) => {
              e.stopPropagation()
              onOpenEmblems?.()
            }}
          >
            emblems {emblemCount}
          </button>
        ) : null}
        <span>
          lands {info.landsPlayedThisTurn}/{info.maxLandsThisTurn}
        </span>
        {/* At the row's end rather than a row of its own, which came and
            went with every mana added and spent and moved the board under
            it (the user's ask, 2026-10-10). */}
        {mana ? (
          <span className="pp-mana" title="Mana pool">
            <Symbols text={mana} />
          </span>
        ) : null}
      </div>
      {info.hasLost ? <div className="pp-lost">{info.lossReason}</div> : null}
    </div>
  )
}

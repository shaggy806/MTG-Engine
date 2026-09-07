/**
 * Human-readable one-liners for `GameEvent`s — the TypeScript sibling of the
 * playground scripts' `format.mjs`, used by the event log.
 */

import type { GameEvent, ObjectId, PlayerId, Step, TargetRef } from 'engine'
import type { SeatStatus } from './net/protocol.ts'

export type NameOf = (id: ObjectId) => string

export function describeTarget(ref: TargetRef, nameOf: NameOf): string {
  return ref.kind === 'player' ? ref.player : nameOf(ref.object)
}

export function describeEvent(event: GameEvent, nameOf: NameOf): string {
  const name = nameOf
  const tgt = (ref: TargetRef): string => describeTarget(ref, nameOf)
  const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`)

  switch (event.type) {
    case 'game-started':
      return `${event.players.join(' vs ')} · ${event.startingPlayer} first · seed ${event.seed}`
    case 'turn-began':
      return `Turn ${event.turn} — ${event.activePlayer}`
    case 'step-began':
      return `[${event.phase}] ${event.step}`
    case 'priority-received':
      return `→ ${event.player}`
    case 'priority-passed':
      return `${event.player} passes`
    case 'permanent-untapped':
      return `${name(event.object)} untaps`
    case 'permanent-tapped':
      return `${name(event.object)} taps`
    case 'mana-added':
      return `${event.player} adds ${event.amount}{${event.mana}}`
    case 'card-drawn':
      return `${event.player} draws ${name(event.object)}`
    case 'draw-from-empty-library':
      return `${event.player} draws from an empty library!`
    case 'cards-discarded':
      return `${event.player} discards ${event.objects.map(name).join(', ')}`
    case 'cards-chosen-from-zone':
      return event.objects.length > 0
        ? `${event.player} takes ${event.objects.map(name).join(', ')}`
        : `${event.player} takes nothing`
    case 'damage-cleared':
      return `damage cleared from ${event.objects.length} permanent(s)`
    case 'land-played':
      return `${event.player} plays ${name(event.object)}`
    case 'spell-cast':
      return `${event.player} casts ${name(event.object)}${
        event.x != null ? ` (X=${event.x})` : ''
      }${event.targets.length ? ` at ${event.targets.map(tgt).join(', ')}` : ''}`
    case 'spell-resolved':
      return `${name(event.object)} resolves`
    case 'spell-fizzled':
      return `${name(event.object)} fizzles — ${event.reason}`
    case 'spell-countered':
      return `${name(event.object)} is countered`
    case 'control-changed':
      return `${event.controller} gains control of ${name(event.object)}${
        event.untilEndOfTurn ? ' until EOT' : ''
      }`
    case 'permanent-copied':
      return event.copyOf
        ? `${name(event.object)} enters as a copy of ${event.copyOf}`
        : `${name(event.object)} copies nothing`
    case 'ability-activated':
      return `${event.player} activates ${name(event.source)}${
        event.onStack ? '' : ' (mana)'
      }`
    case 'ability-resolved':
      return `${name(event.source)}'s ability resolves`
    case 'ability-triggered':
      return `${name(event.source)}'s trigger goes on the stack (${event.controller})`
    case 'trigger-removed':
      return `${name(event.source)}'s trigger removed — ${event.reason}`
    case 'pt-modified':
      return `${name(event.object)} ${signed(event.power)}/${signed(event.toughness)}${
        event.duration === 'end-of-turn' ? ' until EOT' : ''
      }`
    case 'counter-added':
      return `${name(event.object)} gets ${event.amount} ${event.counter} counter(s)`
    case 'keyword-granted':
      return `${name(event.object)} gains ${event.keyword}${
        event.duration === 'end-of-turn' ? ' until EOT' : ''
      }`
    case 'pt-modifier-expired':
      return `${event.objects.map(name).join(', ')} — modifiers wear off`
    case 'attacker-declared':
      return `${name(event.attacker)} attacks ${event.defender}`
    case 'blocker-declared':
      return `${name(event.blocker)} blocks ${name(event.attacker)}`
    case 'permanent-entered-battlefield':
      return `${name(event.object)} enters the battlefield`
    case 'permanent-attached':
      return `${name(event.source)} attaches to ${name(event.target)}`
    case 'damage-dealt':
      return `${name(event.source)} deals ${event.amount} to ${tgt(event.target)}`
    case 'life-changed':
      return `${event.player} ${signed(event.delta)} life (now ${event.life})`
    case 'permanent-destroyed':
      return `${name(event.object)} destroyed — ${event.reason}`
    case 'permanent-destroy-prevented':
      return `${name(event.object)} not destroyed — ${event.reason}`
    case 'permanent-returned-to-hand':
      return `${name(event.object)} returns to ${event.owner}'s hand`
    case 'permanent-exiled':
      return `${name(event.object)} is exiled`
    case 'permanent-sacrificed':
      return `${event.player} sacrifices ${name(event.object)}`
    case 'cards-milled':
      return `${event.player} mills ${event.objects.map(name).join(', ')}`
    case 'player-lost':
      return `${event.player} loses: ${event.reason}`
    case 'game-ended':
      return event.winner
        ? `${event.winner} wins — ${event.reason}`
        : `draw — ${event.reason}`
    case 'mulligan-taken':
      return `${event.player} mulligans (#${event.count})`
    case 'hand-kept':
      return event.mulligans > 0
        ? `${event.player} keeps, after ${event.mulligans} mulligan(s)`
        : `${event.player} keeps their opening hand`
    case 'cards-put-on-bottom':
      return `${event.player} puts ${event.objects.map(name).join(', ')} on the bottom of their library`
    case 'commander-zone-decision':
      return event.toCommandZone
        ? `${name(event.object)} goes to the command zone (from ${event.from})`
        : `${name(event.object)} stays in the ${event.from}`
    default:
      return JSON.stringify(event)
  }
}

/** A player's chosen display name if they've set one (via `seats`, when
 * available), otherwise their seat id capitalized ("alice" -> "Alice"). */
export const playerLabel = (id: PlayerId, seats?: readonly SeatStatus[]): string => {
  const custom = seats?.find((s) => s.player === id)?.displayName
  return custom || id.charAt(0).toUpperCase() + id.slice(1)
}

export type SeatClass = 'seat-a' | 'seat-b' | 'seat-c' | 'seat-d'

const SEAT_CLASSES: readonly SeatClass[] = ['seat-a', 'seat-b', 'seat-c', 'seat-d']

/**
 * A stable per-player identity class, by seating order rather than table
 * position — so a given player reads as the same color on every device
 * regardless of which side of the screen they're rendered on.
 */
export function seatClassOf(turnOrder: readonly PlayerId[], id: PlayerId): SeatClass {
  return SEAT_CLASSES[turnOrder.indexOf(id) % SEAT_CLASSES.length]
}

/** Full step names, spelled out — the phase track's pips use abbreviations. */
export const STEP_LABEL: Record<Step, string> = {
  untap: 'Untap',
  upkeep: 'Upkeep',
  draw: 'Draw',
  'precombat-main': 'Precombat Main Phase',
  'begin-combat': 'Beginning of Combat',
  'declare-attackers': 'Declare Attackers',
  'declare-blockers': 'Declare Blockers',
  'combat-damage': 'Combat Damage',
  'end-combat': 'End of Combat',
  'postcombat-main': 'Postcombat Main Phase',
  end: 'End Step',
  cleanup: 'Cleanup',
}

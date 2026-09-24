/**
 * Human-readable one-liners for `GameEvent`s — the TypeScript sibling of the
 * playground scripts' `format.mjs`, used by the event log.
 */

import type { GameEvent, ObjectId, PlayerId, Step, TargetRef } from 'engine'
import type { SeatStatus } from 'protocol'

export type NameOf = (id: ObjectId) => string

/**
 * Bookkeeping the engine has to record but nobody reads back: priority going
 * round the table, every step boundary, mana entering and leaving a pool,
 * lands tapping to pay for it, damage being wiped at end of turn. A full log
 * is most of this by volume — a single turn against three bots runs to
 * dozens of lines before anything happens — so the history opens without
 * them and offers them behind a toggle for when something needs debugging.
 *
 * The test is deliberately "is this an implementation detail", not "is this
 * unimportant": anything a player could point at and ask "when did that
 * happen?" stays in the default view.
 */
const NOISY_EVENTS: ReadonlySet<GameEvent['type']> = new Set([
  'priority-received',
  'priority-passed',
  'step-began',
  'mana-added',
  'permanent-tapped',
  'permanent-untapped',
  'damage-cleared',
  'library-shuffled',
  'pt-modifier-expired',
  'trigger-removed',
  'ability-resolved',
  'flashback-grant-expired',
  'time-counter-removed',
  // One per targeted object on every targeted spell — bookkeeping for
  // "becomes the target of" triggers, and the spell's own line already
  // names its targets.
  'object-targeted',
  // The whole-declaration summary, for "whenever you attack with N or more
  // creatures" — every attacker already has its own `attacker-declared` line.
  'attackers-declared',
  'attacked-alone',
  'player-attacked',
  // Every blocker already has its own `blocker-declared` line.
  'attacker-blocked',
  // The dying, milling or discarding that put them there has its own line.
  'cards-put-into-graveyard',
])

/** Whether `event` only shows up in the history's detailed mode. */
export function isDetailOnlyEvent(event: GameEvent): boolean {
  return NOISY_EVENTS.has(event.type)
}

/** Where a card was played or cast from — said only when it isn't the hand,
 * which is where nearly everything comes from. */
function fromZone(zone: string): string {
  if (zone === 'hand') return ''
  return ` from ${zone === 'command' ? 'the command zone' : zone}`
}

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
      return `Turn ${event.turn} — ${event.activePlayer}${event.extra ? ' (extra turn)' : ''}`
    case 'extra-turn-queued':
      return `${event.player} takes an extra turn after this one`
    case 'additional-combat-queued':
      return `${event.player} gets an additional combat phase`
    case 'additional-combat-phase':
      return `additional combat phase`
    case 'spell-copied':
      return `${event.controller} copies ${name(event.original)}`
    case 'lore-counter-added':
      return `${name(event.object)} — lore counter ${event.lore}`
    case 'saga-completed':
      return `${name(event.object)} is sacrificed (final chapter)`
    case 'permanent-transformed':
      return `${name(event.object)} transforms (now ${event.front ? 'front' : 'back'} face)`
    case 'day-night-changed':
      return `it becomes ${event.value}`
    case 'counter-failed':
      return `${name(event.object)} can't be countered`
    case 'monarch-changed':
      return `${event.player} becomes the monarch (${event.via})`
    case 'energy-changed':
      return `${event.player} ${event.delta >= 0 ? '+' : ''}${event.delta} energy (now ${event.energy})`
    case 'player-counters-changed':
      return `${playerLabel(event.player)} ${event.delta >= 0 ? 'gets' : 'loses'} ${Math.abs(
        event.delta,
      )} ${event.counter} counter${Math.abs(event.delta) === 1 ? '' : 's'} (now ${event.total})`
    case 'emblem-created':
      return `${event.player} gets an emblem — "${event.text}"`
    case 'card-on-adventure':
      return `${name(event.object)} goes on an adventure (exiled)`
    case 'cascade-revealed':
      return event.cast
        ? `${event.player} cascades into ${name(event.cast)} (${event.exiled.length} exiled)`
        : `${event.player} cascades — nothing to cast (${event.exiled.length} exiled)`
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
    case 'cards-revealed':
      return `${event.player} reveals ${event.objects.map(name).join(', ')} from their ${event.from}`
    case 'cards-chosen-from-zone':
      return event.objects.length > 0
        ? `${event.player} takes ${event.objects.map(name).join(', ')}`
        : `${event.player} takes nothing`
    case 'library-shuffled':
      return `${event.player} shuffles their library`
    case 'scried':
      return `${event.player} ${event.mode}s ${event.looked} (${event.movedAway} ${
        event.mode === 'surveil' ? 'to graveyard' : 'to bottom'
      })`
    case 'proliferated':
      return event.count > 0
        ? `${playerLabel(event.player)} proliferates (${event.count})`
        : `${playerLabel(event.player)} proliferates nothing`
    case 'damage-cleared':
      return `damage cleared from ${event.objects.length} permanent(s)`
    case 'land-played':
      return `${event.player} plays ${name(event.object)}${fromZone(event.from)}`
    case 'spell-cast':
      return `${event.player} casts ${name(event.object)}${fromZone(event.from)}${
        event.via ? ` (${event.via})` : ''
      }${event.x != null ? ` (X=${event.x})` : ''}${
        event.targets.length ? ` at ${event.targets.map(tgt).join(', ')}` : ''
      }`
    case 'spell-resolved':
      return `${name(event.object)} resolves`
    case 'flashback-granted':
      return `${name(event.object)} gains flashback ${event.cost}`
    case 'graveyard-cast-granted':
      return `${event.player} may cast ${name(event.object)} from the graveyard this turn`
    case 'flashback-grant-expired':
      return `${name(event.object)}'s flashback grant expires`
    case 'card-suspended':
      return `${event.player} suspends ${name(event.object)} (${event.timeCounters} time counter${
        event.timeCounters === 1 ? '' : 's'
      })`
    case 'time-counter-removed':
      return `${name(event.object)} — time counter removed (${event.remaining} left)`
    case 'card-foretold':
      return `${event.player} foretells a card`
    case 'card-cycled':
      return `${event.player} cycles ${name(event.object)}`
    case 'escape-cost-paid':
      return `${name(event.object)} escapes (exiling ${event.exiled.length} cards)`
    case 'spell-fizzled':
      return `${name(event.object)} fizzles — ${event.reason}`
    case 'spell-countered':
      return `${name(event.object)} is countered`
    case 'ward-paid':
      return `${event.player} pays ward for ${name(event.object)}`
    case 'ward-unpaid':
      return `${event.player} doesn't pay ward for ${name(event.object)}`
    case 'control-changed':
      return `${event.controller} gains control of ${name(event.object)}${
        event.untilEndOfTurn ? ' until EOT' : ''
      }`
    case 'permanent-copied':
      return event.copyOf
        ? `${name(event.object)} enters as a copy of ${event.copyOf}`
        : `${name(event.object)} copies nothing`
    case 'creature-type-chosen':
      return `${name(event.object)} chooses ${event.creatureType}`
    case 'ability-activated':
      return `${event.player} activates ${name(event.source)}${
        event.onStack ? '' : ' (mana)'
      }`
    case 'ability-resolved':
      return `${name(event.source)}'s ability resolves`
    case 'object-targeted':
      return `${name(event.object)} becomes the target of ${name(event.source)} (${event.by})`
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
    case 'counter-removed':
      return `${name(event.object)} loses ${event.amount} ${event.counter} counter(s)`
    case 'keyword-granted':
      return `${name(event.object)} gains ${event.keyword}${
        event.duration === 'end-of-turn' ? ' until EOT' : ''
      }`
    case 'pt-modifier-expired':
      return `${event.objects.map(name).join(', ')} — modifiers wear off`
    case 'permanent-animated':
      return `${name(event.object)} becomes a ${event.power}/${event.toughness} creature${
        event.duration === 'end-of-turn' ? ' until EOT' : ''
      }`
    case 'types-added':
      return `${name(event.object)} becomes ${[...event.subtypes, ...event.types].join(' ')} in addition to its other types${
        event.duration === 'end-of-turn' ? ' until EOT' : ''
      }`
    case 'text-changed':
      return `${name(event.object)}: text "${event.from}" → "${event.to}"`
    case 'attacker-declared':
      return `${name(event.attacker)} attacks ${name(event.defender as ObjectId)}`
    case 'attackers-declared':
      return `${event.player} attacks with ${event.attackers.length}`
    case 'attacked-alone':
      return `${name(event.attacker)} attacked alone`
    case 'cards-put-into-graveyard':
      return `${event.arrivals.map((a) => name(a.object)).join(', ')} put into a graveyard`
    case 'player-attacked':
      return `${event.player} attacks ${event.defender} with ${event.attackers.length}`
    case 'loyalty-changed':
      return `${name(event.object)} ${signed(event.delta)} loyalty (now ${event.loyalty})`
    case 'blocker-declared':
      return `${name(event.blocker)} blocks ${name(event.attacker)}`
    case 'attacker-blocked':
      return `${name(event.attacker)} is blocked`
    case 'permanent-entered-battlefield':
      return `${name(event.object)} enters the battlefield`
    case 'permanent-left-battlefield':
      return `${name(event.object)} leaves the battlefield → ${event.toZone}`
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
    case 'combat-damage-prevention-set':
      return `all combat damage is prevented this turn`
    case 'damage-prevented':
      return `${name(event.source)}'s ${event.amount} damage to ${tgt(event.target)} is prevented`
    case 'graveyard-replaced-with-exile':
      return `${name(event.object)} is exiled instead of going to a graveyard`
    case 'leave-replaced-with-exile':
      return `${name(event.object)} is exiled instead of going to ${event.intendedZone === 'hand' ? 'a hand' : event.intendedZone === 'library' ? 'a library' : `the ${event.intendedZone}`}`
    case 'prevention-shield-created':
      return `a shield prevents the next ${event.amount} damage to ${tgt(event.target)}`
    case 'draw-redirected':
      return `${playerLabel(event.from)}'s draw is redirected — ${playerLabel(
        event.to,
      )} draws instead`
    case 'modes-chosen': {
      const who = event.player === undefined ? '' : `${playerLabel(event.player)} `
      return event.modes.length > 0
        ? `${name(event.source)} — ${who}chose mode(s) ${event.modes.map((m) => m + 1).join(', ')}`
        : `${name(event.source)} — ${who}declined`
    }
    case 'permanent-returned-to-hand':
      return `${name(event.object)} returns to ${event.owner}'s hand`
    case 'permanent-exiled':
      return `${name(event.object)} is exiled`
    case 'permanent-sacrificed':
      return `${event.player} sacrifices ${name(event.object)}`
    case 'cards-milled':
      return `${event.player} mills ${event.objects.map(name).join(', ')}`
    case 'cards-left-graveyard':
      // A count, not names: some of these cards may have gone somewhere
      // this seat can't see (an opponent's hand), and an unknown id has no
      // name to show.
      return event.objects.length === 1
        ? 'a card leaves a graveyard'
        : `${event.objects.length} cards leave a graveyard`
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

export const SEAT_CLASSES: readonly SeatClass[] = ['seat-a', 'seat-b', 'seat-c', 'seat-d']

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

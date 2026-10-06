/**
 * Human-readable one-liners for `GameEvent`s — the TypeScript sibling of the
 * playground scripts' `format.mjs`, used by the event log.
 */

import type { CombatRestriction, GameEvent, ObjectId, PlayerId, Step, TargetRef } from 'engine/client'
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
/** A combat restriction as the log says it — "X can't block this turn". */
const RESTRICTION_TEXT: Record<CombatRestriction, string> = {
  'cant-attack': "can't attack",
  'cant-block': "can't block",
  'must-attack': 'must attack',
  'must-be-blocked': 'must be blocked by every creature able',
  'must-be-blocked-if-able': 'must be blocked if able',
  'cant-attack-owner': "can't attack its owner",
}

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
  // The chapter ability's own resolution — for "whenever the final chapter
  // ability of a Saga you control resolves".
  'chapter-resolved',
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
  'cards-put-into-exile',
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

/**
 * One event as a sentence. Players go by their display names from `seats`
 * (`playerLabel`), never their seat ids; without `seats`, by the
 * capitalised seat id.
 */
export function describeEvent(event: GameEvent, nameOf: NameOf, seats: readonly SeatStatus[] = []): string {
  const name = nameOf
  const who = (id: PlayerId): string => playerLabel(id, seats)
  const tgt = (ref: TargetRef): string => (ref.kind === 'player' ? who(ref.player) : name(ref.object))
  // An attack's defender is a player or a planeswalker/battle.
  const defender = (id: PlayerId | ObjectId): string =>
    seats.some((s) => s.player === id) ? who(id as PlayerId) : name(id as ObjectId)
  const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`)

  switch (event.type) {
    case 'game-started':
      return `${event.players.map(who).join(' vs ')} · ${who(event.startingPlayer)} first · seed ${event.seed}`
    case 'turn-began':
      return `Turn ${event.turn} — ${who(event.activePlayer)}${event.extra ? ' (extra turn)' : ''}`
    case 'extra-turn-queued':
      return `${who(event.player)} takes an extra turn after this one`
    case 'additional-combat-queued':
      return `${who(event.player)} gets an additional combat phase`
    case 'additional-combat-phase':
      return `additional combat phase`
    case 'spell-copied':
      return `${who(event.controller)} copies ${name(event.original)}`
    case 'ability-copied':
      return event.source === null
        ? `${who(event.controller)} copies an ability`
        : `${who(event.controller)} copies an ability of ${name(event.source)}`
    case 'lore-counter-added':
      return `${name(event.object)} — lore counter ${event.lore}`
    case 'saga-completed':
      return `${name(event.object)} has finished its final chapter`
    case 'chapter-resolved':
      return `${name(event.saga)}'s ${event.final ? 'final ' : ''}chapter ability resolves`
    case 'permanent-transformed':
      return `${name(event.object)} transforms (now ${event.front ? 'front' : 'back'} face)`
    case 'became-monstrous':
      return `${name(event.object)} becomes monstrous`
    case 'permanent-exerted':
      return `${who(event.player)} exerts ${name(event.object)}`
    case 'gift-promised':
      return `${who(event.player)} promises ${name(event.spell)}'s gift to ${who(event.to)}`
    case 'day-night-changed':
      return `it becomes ${event.value}`
    case 'counter-failed':
      return `${name(event.object)} can't be countered`
    case 'monarch-changed':
      return event.via === 'monarch-left'
        ? `${who(event.player)} becomes the monarch (the monarch left the game)`
        : `${who(event.player)} becomes the monarch (${event.via})`
    case 'energy-changed':
      return `${who(event.player)} ${event.delta >= 0 ? '+' : ''}${event.delta} energy (now ${event.energy})`
    case 'player-counters-changed':
      return `${who(event.player)} ${event.delta >= 0 ? 'gets' : 'loses'} ${Math.abs(
        event.delta,
      )} ${event.counter} counter${Math.abs(event.delta) === 1 ? '' : 's'} (now ${event.total})`
    case 'emblem-created':
      return `${who(event.player)} gets an emblem — "${event.text}"`
    case 'card-on-adventure':
      return `${name(event.object)} goes on an adventure (exiled)`
    case 'cascade-revealed':
      return event.cast
        ? `${who(event.player)} cascades into ${name(event.cast)} (${event.exiled.length} exiled)`
        : `${who(event.player)} cascades — nothing to cast (${event.exiled.length} exiled)`
    case 'step-began':
      return `[${event.phase}] ${event.step}`
    case 'priority-received':
      return `→ ${who(event.player)}`
    case 'priority-passed':
      return `${who(event.player)} passes`
    case 'permanent-untapped':
      return `${name(event.object)} untaps`
    case 'permanent-tapped':
      return `${name(event.object)} taps`
    case 'mana-added':
      return `${who(event.player)} adds ${event.amount}{${event.mana}}`
    case 'card-drawn':
      return `${who(event.player)} draws ${name(event.object)}`
    case 'draw-from-empty-library':
      return `${who(event.player)} draws from an empty library!`
    case 'cards-discarded':
      return `${who(event.player)} discards ${event.objects.map(name).join(', ')}`
    case 'cards-revealed':
      return `${who(event.player)} reveals ${event.objects.map(name).join(', ')} from their ${event.from}`
    case 'cards-chosen-from-zone':
      return event.objects.length > 0
        ? `${who(event.player)} takes ${event.objects.map(name).join(', ')}`
        : `${who(event.player)} takes nothing`
    case 'library-shuffled':
      return `${who(event.player)} shuffles their library`
    case 'scried':
      return `${who(event.player)} ${event.mode}s ${event.looked} (${event.movedAway} ${
        event.mode === 'surveil' ? 'to graveyard' : 'to bottom'
      })`
    case 'proliferated':
      return event.count > 0
        ? `${who(event.player)} proliferates (${event.count})`
        : `${who(event.player)} proliferates nothing`
    case 'damage-cleared':
      return `damage cleared from ${event.objects.length} permanent(s)`
    case 'land-played':
      return `${who(event.player)} plays ${name(event.object)}${fromZone(event.from)}`
    case 'spell-cast':
      return `${who(event.player)} casts ${name(event.object)}${fromZone(event.from)}${
        event.via ? ` (${event.via})` : ''
      }${event.x != null ? ` (X=${event.x})` : ''}${
        event.targets.length ? ` at ${event.targets.map(tgt).join(', ')}` : ''
      }`
    case 'spell-resolved':
      return `${name(event.object)} resolves`
    case 'flashback-granted':
      return `${name(event.object)} gains flashback ${event.cost}`
    case 'graveyard-cast-granted':
      return `${who(event.player)} may cast ${name(event.object)} from the graveyard this turn`
    case 'flashback-grant-expired':
      return `${name(event.object)}'s flashback grant expires`
    case 'card-suspended':
      return `${who(event.player)} suspends ${name(event.object)} (${event.timeCounters} time counter${
        event.timeCounters === 1 ? '' : 's'
      })`
    case 'time-counter-removed':
      return `${name(event.object)} — time counter removed (${event.remaining} left)`
    case 'card-foretold':
      return `${who(event.player)} foretells a card`
    case 'card-cycled':
      return `${who(event.player)} cycles ${name(event.object)}`
    case 'escape-cost-paid':
      return `${name(event.object)} escapes (exiling ${event.exiled.length} cards)`
    case 'spell-fizzled':
      return `${name(event.object)} fizzles — ${event.reason}`
    case 'spell-countered':
      return `${name(event.object)} is countered`
    case 'spell-exiled':
      return `${name(event.object)} is exiled from the stack`
    case 'ward-paid':
      return `${who(event.player)} pays ward for ${name(event.object)}`
    case 'ward-unpaid':
      return `${who(event.player)} doesn't pay ward for ${name(event.object)}`
    case 'control-changed':
      return `${who(event.controller)} gains control of ${name(event.object)}${
        event.untilEndOfTurn ? ' until EOT' : ''
      }`
    case 'permanent-copied':
      return event.copyOf
        ? `${name(event.object)} enters as a copy of ${event.copyOf}`
        : `${name(event.object)} copies nothing`
    case 'creature-type-chosen':
      return `${name(event.object)} chooses ${event.creatureType}`
    case 'ability-activated':
      return `${who(event.player)} activates ${name(event.source)}${
        event.onStack ? '' : ' (mana)'
      }`
    case 'ability-resolved':
      return `${name(event.source)}'s ability resolves`
    case 'object-targeted':
      return `${name(event.object)} becomes the target of ${name(event.source)} (${event.by})`
    case 'ability-triggered':
      return `${name(event.source)}'s trigger goes on the stack (${who(event.controller)})`
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
    case 'prohibition-imposed': {
      const what = [event.spells ? `cast ${event.spellsLabel ?? 'spells'}` : null, event.abilities ? 'activate abilities' : null]
        .filter((w) => w !== null)
        .join(' or ')
      return event.object !== undefined
        ? `${name(event.object)}'s activated abilities can't be activated this turn`
        : `${event.players.map((p) => who(p)).join(', ')} can't ${what} this turn`
    }
    case 'restrictions-imposed': {
      const what = event.restrictions.map((r) => RESTRICTION_TEXT[r]).join(' and ')
      return event.object === undefined
        ? `${who(event.player)}: for the rest of the turn, affected creatures ${what}`
        : `${name(event.object)} ${what}${event.duration === undefined || event.duration === 'end-of-turn' ? ' this turn' : ''}`
    }
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
    case 'random-player-chosen':
      return `${who(event.chosen)} is chosen at random: ${name(event.object)} attacks them this combat if able`
    case 'attacker-declared':
      return `${name(event.attacker)} attacks ${defender(event.defender)}`
    case 'entered-attacking':
      return `${name(event.object)} enters attacking ${defender(event.defender)}`
    case 'attackers-declared':
      return `${who(event.player)} attacks with ${event.attackers.length}`
    case 'attacked-alone':
      return `${name(event.attacker)} attacked alone`
    case 'cards-put-into-graveyard':
      return `${event.arrivals.map((a) => name(a.object)).join(', ')} put into a graveyard`
    case 'coin-flipped':
      return `${who(event.player)} ${event.won ? 'wins' : 'loses'} a coin flip`
    case 'cards-put-into-exile':
      return `${event.arrivals.map((a) => name(a.object)).join(', ')} put into exile`
    case 'player-attacked':
      return `${who(event.player)} attacks ${who(event.defender)} with ${event.attackers.length}`
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
      return `${who(event.player)} ${signed(event.delta)} life (now ${event.life})`
    case 'permanent-destroyed':
      return `${name(event.object)} destroyed — ${event.reason}`
    case 'permanent-destroy-prevented':
      return `${name(event.object)} not destroyed — ${event.reason}`
    case 'regeneration-shield-created':
      return `${name(event.object)} will regenerate the next time it would be destroyed this turn`
    case 'combat-damage-prevention-set':
      return event.partialBy !== undefined
        ? `${name(event.partialBy)}: some combat damage is prevented this turn`
        : `all combat damage is prevented this turn`
    case 'damage-prevented':
      return `${name(event.source)}'s ${event.amount} damage to ${tgt(event.target)} is prevented`
    case 'graveyard-replaced-with-exile':
      return `${name(event.object)} is exiled instead of going to a graveyard`
    case 'leave-replaced-with-exile':
      return `${name(event.object)} is exiled instead of going to ${event.intendedZone === 'hand' ? 'a hand' : event.intendedZone === 'library' ? 'a library' : `the ${event.intendedZone}`}`
    case 'prevention-shield-created':
      return `a shield prevents the next ${event.amount} damage to ${tgt(event.target)}`
    case 'draw-redirected':
      return `${who(event.from)}'s draw is redirected — ${who(event.to)} draws instead`
    case 'modes-chosen': {
      const chooser = event.player === undefined ? '' : `${who(event.player)} `
      return event.modes.length > 0
        ? `${name(event.source)} — ${chooser}chose mode(s) ${event.modes.map((m) => m + 1).join(', ')}`
        : `${name(event.source)} — ${chooser}declined`
    }
    case 'permanent-returned-to-hand':
      return `${name(event.object)} returns to ${who(event.owner)}'s hand`
    case 'permanent-exiled':
      return `${name(event.object)} is exiled`
    case 'permanent-sacrificed':
      return `${who(event.player)} sacrifices ${name(event.object)}`
    case 'cards-milled':
      return `${who(event.player)} mills ${event.objects.map(name).join(', ')}`
    case 'cards-left-graveyard':
      // A count, not names: some of these cards may have gone somewhere
      // this seat can't see (an opponent's hand), and an unknown id has no
      // name to show.
      return event.objects.length === 1
        ? 'a card leaves a graveyard'
        : `${event.objects.length} cards leave a graveyard`
    case 'player-lost':
      return `${who(event.player)} loses: ${event.reason}`
    case 'game-ended':
      return event.winner
        ? `${who(event.winner)} wins — ${event.reason}`
        : `draw — ${event.reason}`
    case 'mulligan-taken':
      return `${who(event.player)} mulligans (#${event.count})`
    case 'hand-kept':
      return event.mulligans > 0
        ? `${who(event.player)} keeps, after ${event.mulligans} mulligan(s)`
        : `${who(event.player)} keeps their opening hand`
    case 'cards-put-on-bottom':
      return `${who(event.player)} puts ${event.objects.map(name).join(', ')} on the bottom of their library`
    case 'commander-zone-decision': {
      // A graveyard or exile it's already in (rule 903.9a); a hand or library
      // it hasn't reached (903.9b).
      const there = event.from === 'graveyard' || event.from === 'exile'
      const zone = event.from === 'exile' ? 'exile' : `the ${event.from}`
      if (event.toCommandZone) {
        return there
          ? `${name(event.object)} goes to the command zone from ${zone}`
          : `${name(event.object)} goes to the command zone instead of ${zone}`
      }
      return there
        ? `${name(event.object)} stays in ${zone}`
        : `${name(event.object)} goes to its owner's ${event.from}`
    }
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

/** `text` — a refusal from the engine or server, which names players by
 * seat id ("bob is not being asked to block") and objects by id — with each
 * seat's `playerLabel` and each object's name (`nameOf`) in their place. */
export const withNames = (
  text: string,
  seats: readonly SeatStatus[] | undefined,
  nameOf: NameOf,
): string => {
  const ids = (seats ?? []).map((s) => s.player)
  const seatRe = ids.length > 0 ? new RegExp(`\\b(${ids.join('|')})\\b`, 'g') : null
  const named = seatRe === null ? text : text.replace(seatRe, (id) => playerLabel(id as PlayerId, seats))
  return named.replace(/\bobj-\d+\b/g, (id) => nameOf(id as ObjectId))
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

/**
 * Edits to a scenario (`protocol`'s `ScenarioSpec`), as pure functions: the
 * builder panel makes a new spec with one of these and sends it whole, and
 * the server rebuilds the board from it. The server validates everything;
 * these only keep a spec self-consistent (no attachment to a removed card,
 * no card owned by a seat that's gone).
 */

import type { PlayerId } from 'engine/client'
import type { ScenarioCard, ScenarioSeat, ScenarioSpec, ScenarioStep, ScenarioZone } from 'protocol'

export const SEAT_IDS = ['alice', 'bob', 'carol', 'dave'] as unknown as readonly PlayerId[]

export const ZONES: readonly ScenarioZone[] = ['battlefield', 'hand', 'graveyard', 'exile', 'library', 'command']

export const STEPS: readonly { readonly step: ScenarioStep; readonly label: string }[] = [
  { step: 'upkeep', label: 'Upkeep' },
  { step: 'draw', label: 'Draw' },
  { step: 'precombat-main', label: 'Main 1' },
  { step: 'begin-combat', label: 'Beginning of combat' },
  { step: 'postcombat-main', label: 'Main 2' },
  { step: 'end', label: 'End step' },
]

let keySeq = 0
/** A key no card in `spec` has. */
export function newKey(spec: ScenarioSpec): string {
  const taken = new Set(spec.cards.map((c) => c.key))
  let key: string
  do {
    keySeq += 1
    key = `k${Date.now().toString(36)}${keySeq.toString(36)}`
  } while (taken.has(key))
  return key
}

/** Adds `count` copies of a card, each its own key. A library card goes on
 * top unless `bottom`. */
export function addCards(
  spec: ScenarioSpec,
  card: Omit<ScenarioCard, 'key'>,
  count = 1,
  bottom = false,
): ScenarioSpec {
  const added: ScenarioCard[] = []
  let next = spec
  for (let i = 0; i < count; i += 1) {
    const one = { ...card, key: newKey(next) }
    added.push(one)
    next = { ...next, cards: [...next.cards, one] }
  }
  if (card.zone === 'library' && !bottom) {
    // Top of the library is the first library card listed.
    const rest = spec.cards
    const firstLibrary = rest.findIndex((c) => c.zone === 'library' && c.owner === card.owner)
    const at = firstLibrary < 0 ? rest.length : firstLibrary
    return { ...spec, cards: [...rest.slice(0, at), ...added, ...rest.slice(at)] }
  }
  return { ...spec, cards: [...spec.cards, ...added] }
}

/** Changes one card. Leaving the battlefield drops what only makes sense
 * there (tapped, counters, attachments — to it and by it). */
export function updateCard(spec: ScenarioSpec, key: string, change: Partial<Omit<ScenarioCard, 'key'>>): ScenarioSpec {
  const before = spec.cards.find((c) => c.key === key)
  if (before === undefined) return spec
  let after: ScenarioCard = { ...before, ...change }
  const leftBattlefield = after.zone !== 'battlefield'
  if (leftBattlefield) {
    const { tapped: _t, sick: _s, counters: _c, attachedTo: _a, ...rest } = after
    after = rest
  }
  if (after.zone === 'command' && after.commander !== true) after = { ...after, zone: 'battlefield' }
  return {
    ...spec,
    cards: spec.cards.map((c) => {
      if (c.key === key) return after
      if (leftBattlefield && c.attachedTo === key) return withoutAttachment(c)
      return c
    }),
  }
}

function withoutAttachment(card: ScenarioCard): ScenarioCard {
  const { attachedTo: _a, ...rest } = card
  return rest
}

/** Removes one card, and every attachment to it. */
export function removeCard(spec: ScenarioSpec, key: string): ScenarioSpec {
  return {
    ...spec,
    cards: spec.cards.filter((c) => c.key !== key).map((c) => (c.attachedTo === key ? withoutAttachment(c) : c)),
  }
}

/** A copy of one card beside it, unattached. */
export function duplicateCard(spec: ScenarioSpec, key: string): ScenarioSpec {
  const i = spec.cards.findIndex((c) => c.key === key)
  if (i < 0) return spec
  const { attachedTo: _a, commander: _c, ...rest } = spec.cards[i]
  const copy: ScenarioCard = { ...rest, key: newKey(spec), ...(rest.zone === 'command' ? { zone: 'battlefield' } : {}) }
  return { ...spec, cards: [...spec.cards.slice(0, i + 1), copy, ...spec.cards.slice(i + 1)] }
}

/** Sets a counter kind to `n`, removing it at 0. */
export function setCounter(spec: ScenarioSpec, key: string, kind: string, n: number): ScenarioSpec {
  const card = spec.cards.find((c) => c.key === key)
  if (card === undefined || kind.trim() === '') return spec
  const counters = { ...(card.counters ?? {}) }
  if (n > 0) counters[kind.trim()] = Math.floor(n)
  else delete counters[kind.trim()]
  const { counters: _c, ...rest } = card
  const next = Object.keys(counters).length > 0 ? { ...rest, counters } : rest
  return { ...spec, cards: spec.cards.map((c) => (c.key === key ? next : c)) }
}

/** Two to four seats: added seats start at the first seat's life; a removed
 * seat's cards go with it, and the turn passes to alice if it was theirs. */
export function setSeatCount(spec: ScenarioSpec, count: number): ScenarioSpec {
  const n = Math.max(2, Math.min(4, Math.floor(count)))
  const life = spec.seats[0]?.life ?? 40
  const seats: ScenarioSeat[] = SEAT_IDS.slice(0, n).map(
    (player) => spec.seats.find((s) => s.player === player) ?? { player, life, bot: true },
  )
  const kept = new Set<string>(seats.map((s) => s.player))
  let cards = spec.cards.filter((c) => kept.has(c.owner))
  const keys = new Set(cards.map((c) => c.key))
  cards = cards.map((c) => (c.attachedTo !== undefined && !keys.has(c.attachedTo) ? withoutAttachment(c) : c))
  return { ...spec, seats, cards, active: kept.has(spec.active) ? spec.active : seats[0].player }
}

export function updateSeat(spec: ScenarioSpec, player: PlayerId, change: Partial<Omit<ScenarioSeat, 'player'>>): ScenarioSpec {
  return { ...spec, seats: spec.seats.map((s) => (s.player === player ? { ...s, ...change } : s)) }
}

/** The cards of one seat's zone, in order. */
export function cardsIn(spec: ScenarioSpec, player: PlayerId, zone: ScenarioZone): readonly ScenarioCard[] {
  return spec.cards.filter((c) => c.owner === player && c.zone === zone)
}

/** Reads a scenario pasted or loaded from a file: enough checking to know
 * it's shaped like one. The server checks the rest as it builds. */
export function parseScenario(text: string): ScenarioSpec {
  const value: unknown = JSON.parse(text)
  if (typeof value !== 'object' || value === null) throw new Error('not a scenario')
  const spec = value as Partial<ScenarioSpec>
  if (!Array.isArray(spec.seats) || !Array.isArray(spec.cards) || typeof spec.active !== 'string') {
    throw new Error('not a scenario: it needs seats, cards and active')
  }
  return {
    seats: spec.seats,
    cards: spec.cards,
    active: spec.active,
    step: spec.step ?? 'precombat-main',
    libraryFill: spec.libraryFill ?? 40,
  }
}

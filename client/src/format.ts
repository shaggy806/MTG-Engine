/**
 * Human-readable one-liners for `GameEvent`s — the TypeScript sibling of the
 * playground scripts' `format.mjs`, used by the event log.
 */

import type { GameEvent, ObjectId, PlayerId, TargetRef } from 'engine'

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
    case 'damage-cleared':
      return `damage cleared from ${event.objects.length} permanent(s)`
    case 'land-played':
      return `${event.player} plays ${name(event.object)}`
    case 'spell-cast':
      return `${event.player} casts ${name(event.object)}${
        event.targets.length ? ` at ${event.targets.map(tgt).join(', ')}` : ''
      }`
    case 'spell-resolved':
      return `${name(event.object)} resolves`
    case 'spell-fizzled':
      return `${name(event.object)} fizzles — ${event.reason}`
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
    case 'player-lost':
      return `${event.player} loses: ${event.reason}`
    case 'game-ended':
      return event.winner
        ? `${event.winner} wins — ${event.reason}`
        : `draw — ${event.reason}`
    default:
      return JSON.stringify(event)
  }
}

export const playerLabel = (id: PlayerId): string =>
  id.charAt(0).toUpperCase() + id.slice(1)

import { BUILTIN_CARDS } from 'engine'
import type { CardDefinition, ObjectId, PlayerId, VisibleObject } from 'engine'

const CARD_BY_NAME = new Map(BUILTIN_CARDS.map((c) => [c.name, c]))

/** Looks up a card's printed definition by name — every implemented card is
 * bundled client-side (`BUILTIN_CARDS`), so this works for any seat's chosen
 * commander without a server round-trip, regardless of which device picked
 * it. `null` for a name the pool doesn't implement. */
export function findCardDef(name: string): CardDefinition | null {
  return CARD_BY_NAME.get(name) ?? null
}

/**
 * A cheap `CardDefinition` → `VisibleObject` adapter for gallery tiles and
 * hover previews (the library page, the deck builder, the card lab) —
 * *printed* values only, no layer computation. The detail pane and the
 * sandbox use a real `game.viewFor(...)` instead, which reflects static
 * abilities / counters / animation.
 */
export function defToVisible(def: CardDefinition): VisibleObject {
  const owner = 'you' as PlayerId
  const isCreature = def.power !== null && def.toughness !== null
  return {
    id: `def-${def.name}` as ObjectId,
    cardName: def.name,
    copyOf: null,
    faceName: def.faces && def.faces.length > 1 ? def.faces[0] : def.name,
    faces: def.faces ?? null,
    art: def.art,
    owner,
    controller: owner,
    zone: 'battlefield',
    manaCost: def.manaCost,
    text: def.text,
    types: def.types,
    subtypes: def.subtypes,
    power: isCreature ? def.power : null,
    toughness: isCreature ? def.toughness : null,
    loyalty: def.loyalty,
    keywords: def.keywords,
    restrictions: [],
    colors: def.colors,
    tapped: false,
    damageMarked: 0,
    counters: {},
    summoningSick: false,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: 'card',
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    targets: null,
    xValue: null,
    isToken: false,
    stackCount: null,
    isCopy: false,
    suspended: false,
    foretold: false,
    attachedTo: null,
    isCommander: def.supertypes.includes('legendary'),
  }
}

import type { CardDefinition, ObjectId, PlayerId, VisibleObject } from 'engine'

/**
 * A cheap `CardDefinition` → `VisibleObject` adapter for gallery tiles —
 * *printed* values only, no layer computation. The detail pane and the
 * sandbox use a real `game.viewFor(...)` instead, which reflects static
 * abilities / counters / animation.
 */
export function defToVisible(def: CardDefinition): VisibleObject {
  const owner = 'you' as PlayerId
  const isCreature = def.power !== null && def.toughness !== null
  return {
    id: `lab-${def.name}` as ObjectId,
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

import type { CardDefinition, ObjectId, PlayerId, VisibleObject } from 'engine/client'

/**
 * A cheap `CardDefinition` → `VisibleObject` adapter for hover previews (the
 * deck builder's, and a double-faced card's other face in the zone viewer) —
 * *printed* values only, no layer computation. A card in a real game comes
 * from `viewFor(...)` instead, which reflects static abilities, counters and
 * animation.
 *
 * `art` overrides the definition's own illustration, for a deck that has
 * chosen a printing (`SavedDeck.printings`) — the same substitution
 * `viewFor` makes in a real game, so a card previewed in the deck builder
 * looks like the one that will hit the table.
 */
export function defToVisible(def: CardDefinition, art?: string | null): VisibleObject {
  const owner = 'you' as PlayerId
  const isCreature = def.power !== null && def.toughness !== null
  return {
    id: `def-${def.name}` as ObjectId,
    cardName: def.name,
    copyOf: null,
    faceName: def.faces && def.faces.length > 1 ? def.faces[0] : def.name,
    faces: def.faces ?? null,
    art: art ?? def.art,
    // Always the face this definition *is* — `defToVisible` is handed one
    // face's own `CardDefinition`, and a back face pins its own art, so
    // there's never a front image to ask Scryfall past.
    faceIsBack: false,
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
    blocked: false,
    kind: 'card',
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
    goadedBy: [],
    suspected: false,
  }
}

/**
 * An emblem (rule 114) as a card the zone viewer can draw. Emblems aren't
 * objects, so the view lists them by owner and text; this dresses one up the
 * way a printed emblem looks: titled "Emblem — <source>", with the source
 * card's art (looked up by its name) and the emblem's text. `index` only has
 * to be unique among the emblems shown.
 */
export function emblemToVisible(
  emblem: { readonly owner: PlayerId; readonly text: string; readonly source: string | null },
  index: number,
): VisibleObject {
  const face = emblem.source ?? 'Emblem'
  return {
    id: `emblem-${index}` as ObjectId,
    cardName: face,
    copyOf: null,
    // The source card's name, so the art lookup finds its illustration.
    faceName: face,
    name: emblem.source === null ? 'Emblem' : `Emblem — ${emblem.source}`,
    faces: null,
    art: null,
    faceIsBack: false,
    owner: emblem.owner,
    controller: emblem.owner,
    zone: 'command',
    manaCost: null,
    text: emblem.text,
    types: [],
    subtypes: [],
    power: null,
    toughness: null,
    loyalty: null,
    keywords: [],
    restrictions: [],
    colors: [],
    tapped: false,
    damageMarked: 0,
    counters: {},
    summoningSick: false,
    attacking: null,
    blocking: null,
    blocked: false,
    kind: 'card',
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
    isCommander: false,
    goadedBy: [],
    suspected: false,
  }
}

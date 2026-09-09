import type {
  ActivatedAbility,
  CardDefinition,
  EffectSpec,
  StaticAbility,
  TriggeredAbility,
} from 'engine'

/**
 * A flat readout of which engine features a card exercises — effect kinds,
 * trigger kinds, ability-cost pieces, target specs, and the specialised
 * top-level `CardDefinition` fields. Rendered as chips in the lab; handy both
 * as an at-a-glance "what does this card use" and as a cross-check against the
 * engine's known limitations.
 */
export interface CardFeatures {
  readonly effects: readonly string[]
  readonly triggers: readonly string[]
  readonly targets: readonly string[]
  readonly costs: readonly string[]
  readonly statics: readonly string[]
  readonly flags: readonly string[]
}

function walkEffect(e: EffectSpec | null, out: Set<string>): void {
  if (!e) return
  out.add(e.kind)
  const anyE = e as Record<string, unknown>
  if (Array.isArray(anyE.effects)) {
    for (const sub of anyE.effects as EffectSpec[]) walkEffect(sub, out)
  }
  if (anyE.then) walkEffect(anyE.then as EffectSpec, out)
  if (anyE.effect) walkEffect(anyE.effect as EffectSpec, out)
  if (Array.isArray(anyE.modes)) {
    for (const m of anyE.modes as { effect?: EffectSpec }[]) walkEffect(m.effect ?? null, out)
  }
}

function abilityCostTags(a: ActivatedAbility, out: Set<string>): void {
  const c = a.cost
  if (c.mana && /\{X\}/.test(c.mana)) out.add('{X} cost')
  if (c.tap) out.add('{T} cost')
  if (c.sacrifice) out.add(`sacrifice: ${c.sacrifice}`)
  if (c.payLife) out.add('pay life')
  if (c.removeCounter) out.add('remove counter')
  if (c.payEnergy) out.add('pay energy')
  if (a.loyaltyCost !== undefined) out.add('loyalty ability')
  if (a.sorcerySpeed) out.add('sorcery-speed')
}

function staticTags(s: StaticAbility, out: Set<string>): void {
  out.add(`affects: ${s.affects.scope}`)
  if (s.replacement) out.add(`replacement: ${s.replacement.event}`)
  if (s.grantPt) out.add('grantPt')
  if (s.grantKeywords) out.add('grantKeywords')
  if (s.grantsActivated) out.add('grantsActivated')
  if (s.condition) out.add(`condition: ${s.condition.kind}`)
  if (s.costModification) out.add('costModification')
  if (s.ward) out.add('ward')
  if (s.protection) out.add('protection')
  if (s.restrictions) for (const r of s.restrictions) out.add(`restriction: ${r}`)
  if (s.setBasePtFromCount) out.add('setBasePtFromCount')
}

export function describeCardFeatures(def: CardDefinition): CardFeatures {
  const effects = new Set<string>()
  const triggers = new Set<string>()
  const targets = new Set<string>()
  const costs = new Set<string>()
  const statics = new Set<string>()
  const flags = new Set<string>()

  walkEffect(def.effect, effects)
  if (def.resolve) flags.add('imperative resolve()')
  for (const t of def.targets) targets.add(t)

  for (const a of def.activated as readonly ActivatedAbility[]) {
    abilityCostTags(a, costs)
    walkEffect(a.effect, effects)
    for (const t of a.targets) targets.add(t)
    if (a.resolve) flags.add('imperative resolve()')
  }
  for (const tr of def.triggered as readonly TriggeredAbility[]) {
    triggers.add(tr.trigger.on)
    walkEffect(tr.effect, effects)
    for (const t of tr.targets) targets.add(t)
    if (tr.resolve) flags.add('imperative resolve()')
  }
  for (const s of def.static) staticTags(s, statics)
  for (const ch of def.chapters ?? []) {
    walkEffect(ch.effect, effects)
    for (const t of ch.targets) targets.add(t)
  }
  for (const m of def.castModal?.modes ?? []) {
    walkEffect(m.effect, effects)
    for (const t of m.targets ?? []) targets.add(t)
  }

  const flagFields: (keyof CardDefinition)[] = [
    'castModal',
    'loyalty',
    'flashback',
    'foretell',
    'escape',
    'suspend',
    'chapters',
    'faces',
    'transform',
    'disturb',
    'adventure',
    'copyOnEnter',
    'controlEnchanted',
    'cantBeCountered',
    'revealsOwnLibraryTop',
    'art',
  ]
  for (const f of flagFields) {
    const v = def[f]
    if (v !== null && v !== false && v !== undefined) flags.add(String(f))
  }

  return {
    effects: [...effects].sort(),
    triggers: [...triggers].sort(),
    targets: [...targets].sort(),
    costs: [...costs].sort(),
    statics: [...statics].sort(),
    flags: [...flags].sort(),
  }
}

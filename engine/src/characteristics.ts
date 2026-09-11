/**
 * Current (as opposed to printed) characteristics of an object, computed from
 * the continuous-effects layer system (rule 613).
 *
 * Implemented: **layer 1** (copy — every read resolves through
 * `printedCardName`, so a Clone has the copied card's P/T / types / abilities),
 * **layer 3** (text-change — a `PtModifier.textSubstitution` rewrites a
 * creature-type word in a permanent's subtypes and its lord clause), **layer
 * 4** (type-change — `PtModifier.addTypes`/`setSubtypes`/`addSubtypes` from a
 * man-land or Turn to Frog), **layer 5** (colour-change —
 * `PtModifier.setColors`/`addColors`), **layer 6** (keyword grants, plus
 * `PtModifier.loseAbilities` removing a permanent's own abilities), **layer
 * 7b** (a `"self"` CDA sets base P/T, then a `PtModifier.setPt` from a
 * "becomes a N/N"), **layer 7c** (counters), **layer 7d** (P/T bonuses +
 * modifiers), timestamp-ordered within a layer. NOT yet: full text-change
 * beyond a creature-type word, and dependency ordering. Layer 2
 * (control-change) is modeled in `game.ts` by reassigning
 * `GameObject.controller`, not here.
 */

import type {
  AffectSpec,
  CardRegistry,
  CardType,
  CombatRestriction,
  CountSpec,
  Keyword,
  StaticCondition,
} from "./cards.js";
import { matchesFilter } from "./filter.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameObject, GameState } from "./state.js";

/**
 * Ids whose static `condition` is currently being evaluated. A condition that
 * reads other permanents' *computed* characteristics (`controls` / `metalcraft`)
 * can loop back here — two Kird Apes each ask "does the other satisfy my
 * condition?". Re-entry for an id already on this stack returns `false`
 * (conservative): the inner call resolves that permanent's non-conditional
 * characteristics (type / subtypes), which is all the outer scan needs.
 * Transient computation scaffolding — never part of `GameState`.
 */
const conditionInProgress = new Set<ObjectId>();

/** Options for {@link staticConditionMet}. */
export interface ConditionOptions {
  /**
   * Whether `source` itself counts toward a board-scanning condition
   * (`controls` / `opponent-controls` / `metalcraft`). A *static* ability's
   * condition leaves itself out (default) — the scan would otherwise recurse
   * straight back into the characteristics computation that asked. A
   * triggered ability's intervening-if clause (rule 603.4) is evaluated
   * outside the layer fold and *must* count the source ("When ~ enters, if
   * you control a Dragon …" on a Dragon counts itself), so it passes `true`.
   */
  readonly includeSelf?: boolean;
}

/**
 * Whether a {@link StaticCondition} is currently met, evaluated from the
 * perspective of `source`'s controller. A static / trigger with no condition
 * is always "met" — callers check that first.
 *
 * By default the battlefield scan skips `source` itself (see
 * {@link ConditionOptions.includeSelf}), and a re-entrant call for the same id
 * short-circuits to `false` (see `conditionInProgress`). Full dependency
 * ordering between mutually-conditional permanents is not modeled (the same
 * gap noted for layers generally).
 * ROADMAP Phase 11 EG-3; extended to triggered abilities in needed-cards P7.
 */
export function staticConditionMet(
  state: GameState,
  registry: CardRegistry,
  source: GameObject,
  condition: StaticCondition,
  opts: ConditionOptions = {},
): boolean {
  if (conditionInProgress.has(source.id)) return false;
  conditionInProgress.add(source.id);
  try {
    return evalStaticCondition(state, registry, source, condition, opts);
  } finally {
    conditionInProgress.delete(source.id);
  }
}

function evalStaticCondition(
  state: GameState,
  registry: CardRegistry,
  source: GameObject,
  condition: StaticCondition,
  opts: ConditionOptions,
): boolean {
  const you = source.controller;
  const skipsSelf = (id: ObjectId): boolean =>
    opts.includeSelf !== true && id === source.id;
  switch (condition.kind) {
    case "your-turn":
      return state.turnOrder[state.turn.activePlayerIndex] === you;
    case "threshold":
      return state.zones.perPlayer[you].graveyard.length >= 7;
    case "metalcraft":
      return (
        state.zones.shared.battlefield.filter((id) => {
          const o = state.objects[id];
          return (
            !skipsSelf(id) &&
            o.controller === you &&
            computeCharacteristics(state, registry, id).types.includes("artifact")
          );
        }).length >= 3
      );
    case "controls":
      return (
        state.zones.shared.battlefield.filter(
          (id) =>
            !skipsSelf(id) &&
            state.objects[id].controller === you &&
            matchesFilter(state, registry, id, condition.filter, { you }),
        ).length >= condition.atLeast
      );
    case "opponent-controls":
      // "an opponent controls three or more creatures" — one opponent must
      // meet the count on their own, so count per player and take the best.
      return state.turnOrder.some(
        (p) =>
          p !== you &&
          !state.players[p].hasLost &&
          state.zones.shared.battlefield.filter(
            (id) =>
              !skipsSelf(id) &&
              state.objects[id].controller === p &&
              matchesFilter(state, registry, id, condition.filter, { you: p }),
          ).length >= condition.atLeast,
      );
  }
}

export interface Characteristics {
  readonly power: number;
  readonly toughness: number;
  readonly keywords: ReadonlySet<Keyword>;
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  readonly colors: ReadonlySet<Color>;
  readonly controller: PlayerId;
  /** Combat restrictions from static abilities (Pacifism, Juggernaut). */
  readonly restrictions: ReadonlySet<CombatRestriction>;
  /** Protection (rule 702.16): the union of every "protection from …" clause
   * — a source with any of these colours or types can't target / block /
   * enchant / damage this object. */
  readonly protectionFrom: {
    readonly colors: ReadonlySet<Color>;
    readonly types: ReadonlySet<CardType>;
  };
}

/** True if this permanent has lost its own abilities (layer 6 — Turn to Frog). */
export function hasLostAbilities(object: GameObject): boolean {
  return object.modifiers.some((m) => m.loseAbilities === true);
}

/** Apply this object's own text-substitution modifiers (layer 3) to one word. */
function substituteWord(object: GameObject, word: string): string {
  let w = word;
  for (const m of object.modifiers) {
    if (m.textSubstitution && w === m.textSubstitution.from) w = m.textSubstitution.to;
  }
  return w;
}

/**
 * A permanent's current subtypes: printed → layer 3 (text substitution) →
 * layer 4 (`setSubtypes` replaces, then `addSubtypes` unions). Self-contained
 * (nothing external grants subtypes here), so it's safe to call from
 * `staticAffects` without recursing back into {@link computeCharacteristics}.
 */
export function effectiveSubtypes(
  registry: CardRegistry,
  object: GameObject,
): readonly string[] {
  let subtypes: readonly string[] = registry.get(printedCardName(object)).subtypes;
  for (const m of object.modifiers) {
    if (m.textSubstitution) {
      const { from, to } = m.textSubstitution;
      subtypes = subtypes.map((s) => (s === from ? to : s));
    }
  }
  for (const m of object.modifiers) {
    if (m.setSubtypes) subtypes = [...m.setSubtypes];
  }
  const added: string[] = [];
  for (const m of object.modifiers) if (m.addSubtypes) added.push(...m.addSubtypes);
  return added.length > 0 ? [...new Set([...subtypes, ...added])] : subtypes;
}

/** A permanent's current colours: printed → layer 5 (`setColors` replaces,
 * `addColors` unions), in modifier order. */
export function effectiveColors(
  registry: CardRegistry,
  object: GameObject,
): Set<Color> {
  let colors = new Set<Color>(registry.get(printedCardName(object)).colors);
  for (const m of object.modifiers) {
    if (m.setColors) colors = new Set(m.setColors);
    if (m.addColors) for (const c of m.addColors) colors.add(c);
  }
  return colors;
}

/** The current value of a CDA's dynamic count (rule 604.3). */
function countValue(
  spec: CountSpec,
  state: GameState,
  registry: CardRegistry,
  controller: PlayerId,
): number {
  switch (spec) {
    case "cards-in-all-graveyards":
      return state.turnOrder.reduce(
        (n, p) => n + state.zones.perPlayer[p].graveyard.length,
        0,
      );
    case "creature-cards-in-all-graveyards":
      return state.turnOrder.reduce(
        (n, p) =>
          n +
          state.zones.perPlayer[p].graveyard.filter((id) =>
            registry.get(state.objects[id].cardName).types.includes("creature"),
          ).length,
        0,
      );
    case "lands-you-control":
      return state.zones.shared.battlefield.filter((id) => {
        const o = state.objects[id];
        return o.controller === controller && registry.get(o.cardName).types.includes("land");
      }).length;
    default:
      return 0;
  }
}

function counterPtBonus(counter: string): { power: number; toughness: number } {
  if (counter === "+1/+1") return { power: 1, toughness: 1 };
  if (counter === "-1/-1") return { power: -1, toughness: -1 };
  return { power: 0, toughness: 0 };
}

function isPrintedCreature(
  registry: CardRegistry,
  object: GameObject,
): boolean {
  return registry.get(printedCardName(object)).types.includes("creature");
}

export function staticAffects(
  registry: CardRegistry,
  affects: AffectSpec,
  source: GameObject,
  target: GameObject,
): boolean {
  if (affects.scope === "self") return source.id === target.id;
  if (affects.scope === "attached") return source.attachedTo === target.id;
  if (affects.scope === "lands-you-control") {
    return (
      target.controller === source.controller &&
      registry.get(printedCardName(target)).types.includes("land")
    );
  }
  // "creatures-you-control"
  if (affects.excludeSelf && source.id === target.id) return false;
  if (target.controller !== source.controller) return false;
  if (!isPrintedCreature(registry, target)) return false;
  if (affects.subtype !== undefined) {
    // The source's own text-change (Artificial Evolution on Goblin Chieftain)
    // rewrites the word in its lord clause too; the target is matched on its
    // *current* subtypes (layer 3 + 4).
    const wanted = substituteWord(source, affects.subtype);
    if (!effectiveSubtypes(registry, target).includes(wanted)) return false;
  }
  return true;
}

interface AppliedEffect {
  readonly timestamp: number;
  readonly power: number;
  readonly toughness: number;
  readonly keywords: readonly Keyword[];
  readonly restrictions: readonly CombatRestriction[];
  readonly protection: { colors?: readonly Color[]; types?: readonly CardType[] } | null;
}

/** Continuous effects from battlefield permanents that apply to `target`. */
function collectStaticEffects(
  state: GameState,
  registry: CardRegistry,
  target: GameObject,
): AppliedEffect[] {
  const out: AppliedEffect[] = [];
  for (const sourceId of state.zones.shared.battlefield) {
    const source = state.objects[sourceId];
    if (hasLostAbilities(source)) continue; // layer 6 — its statics don't function
    for (const ability of registry.get(printedCardName(source)).static) {
      // Only P/T-bonus / keyword-grant / restriction statics contribute here.
      // A static that is purely a replacement (rule 614 — "enters tapped") or
      // a CDA (`setBasePtFromCount`, handled in its own pass) modifies nothing.
      if (
        ability.grantPt === undefined &&
        ability.grantKeywords === undefined &&
        ability.restrictions === undefined &&
        ability.protection === undefined
      ) {
        continue;
      }
      if (!staticAffects(registry, ability.affects, source, target)) continue;
      // "As long as …" gate (rule 604.3 — ROADMAP Phase 11 EG-3). Checked
      // *after* `staticAffects` so a static that can't reach `target` never
      // evaluates its condition (which may itself read other permanents'
      // characteristics — checking it eagerly would recurse).
      if (
        ability.condition !== undefined &&
        !staticConditionMet(state, registry, source, ability.condition)
      ) {
        continue;
      }
      out.push({
        timestamp: source.timestamp,
        power: ability.grantPt?.[0] ?? 0,
        toughness: ability.grantPt?.[1] ?? 0,
        keywords: ability.grantKeywords ?? [],
        restrictions: ability.restrictions ?? [],
        protection: ability.protection ?? null,
      });
    }
  }
  // Emblems (rule 114 — ROADMAP Phase 10): a player-owned anthem with no
  // battlefield object. Only the `"creatures-you-control"` scope is supported.
  for (const emblem of state.emblems) {
    const ability = emblem.static;
    if (
      ability === null ||
      ability.affects.scope !== "creatures-you-control" ||
      (ability.grantPt === undefined &&
        ability.grantKeywords === undefined &&
        ability.restrictions === undefined &&
        ability.protection === undefined)
    ) {
      continue;
    }
    if (target.controller !== emblem.owner || !isPrintedCreature(registry, target)) continue;
    if (
      ability.affects.subtype !== undefined &&
      !effectiveSubtypes(registry, target).includes(ability.affects.subtype)
    ) {
      continue;
    }
    out.push({
      timestamp: emblem.timestamp,
      power: ability.grantPt?.[0] ?? 0,
      toughness: ability.grantPt?.[1] ?? 0,
      keywords: ability.grantKeywords ?? [],
      restrictions: ability.restrictions ?? [],
      protection: ability.protection ?? null,
    });
  }
  out.sort((a, b) => a.timestamp - b.timestamp);
  return out;
}

export function computeCharacteristics(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): Characteristics {
  const object = state.objects[id];
  const def = registry.get(printedCardName(object));

  const onBattlefield = object.zone === "battlefield";
  const lostAbilities = onBattlefield && hasLostAbilities(object);

  let power = def.power ?? 0;
  let toughness = def.toughness ?? 0;
  // Layer 6 — a permanent that lost its abilities keeps no printed keywords.
  const keywords = new Set<Keyword>(lostAbilities ? [] : def.keywords);
  let types: readonly CardType[] = def.types;
  // Layers 3 + 4 — text substitution, then set/add subtypes.
  const subtypes: readonly string[] = onBattlefield
    ? effectiveSubtypes(registry, object)
    : def.subtypes;
  // Layer 5 — colour-changing effects.
  const colors: ReadonlySet<Color> = onBattlefield
    ? effectiveColors(registry, object)
    : new Set(def.colors);

  const staticEffects = onBattlefield
    ? collectStaticEffects(state, registry, object)
    : [];

  // Layer 4 — type adds. A man-land's animation adds `creature` (and often
  // `artifact`) on top of the printed types; nothing removes types yet.
  if (onBattlefield) {
    const addedTypes: CardType[] = [];
    for (const modifier of object.modifiers) {
      if (modifier.addTypes) addedTypes.push(...modifier.addTypes);
    }
    if (addedTypes.length > 0) types = [...new Set([...types, ...addedTypes])];
  }

  // Layer 6 — ability adds (external anthems + modifier grants still reach a
  // permanent that lost its *own* abilities).
  // `collectStaticEffects` already includes a permanent's own `"self"`
  // restriction static (Juggernaut) as well as external ones (Pacifism).
  const restrictions = new Set<CombatRestriction>();
  const protColors = new Set<Color>();
  const protTypes = new Set<CardType>();
  for (const effect of staticEffects) {
    for (const keyword of effect.keywords) keywords.add(keyword);
    for (const r of effect.restrictions) restrictions.add(r);
    if (effect.protection) {
      for (const c of effect.protection.colors ?? []) protColors.add(c);
      for (const t of effect.protection.types ?? []) protTypes.add(t);
    }
  }
  for (const modifier of object.modifiers) {
    for (const keyword of modifier.keywords) keywords.add(keyword);
  }

  // Layer 7b — base P/T set by this permanent's own characteristic-defining
  // ability (rule 604.3 / 613.4b). Only a `"self"` static applies — and not
  // if the permanent has lost its abilities.
  if (onBattlefield && !lostAbilities) {
    for (const ability of def.static) {
      if (ability.setBasePtFromCount === undefined) continue;
      if (
        ability.condition !== undefined &&
        !staticConditionMet(state, registry, object, ability.condition)
      ) {
        continue;
      }
      const n = countValue(
        ability.setBasePtFromCount.countOf,
        state,
        registry,
        object.controller,
      );
      power = n + ability.setBasePtFromCount.plusPower;
      toughness = n + ability.setBasePtFromCount.plusToughness;
    }
  }
  // Layer 7b — a "becomes a N/N" (man-land animation, Turn to Frog) *sets*
  // base P/T. This is part of the effect, not the permanent's own CDA, so it
  // still applies when the same effect also removed its abilities. Latest
  // wins; before counters (7c) and bonuses (7d).
  if (onBattlefield) {
    for (const modifier of object.modifiers) {
      if (modifier.setPt) {
        power = modifier.setPt[0];
        toughness = modifier.setPt[1];
      }
    }
  }

  // Layer 7c — P/T counters.
  for (const [counter, count] of Object.entries(object.counters)) {
    const bonus = counterPtBonus(counter);
    power += bonus.power * count;
    toughness += bonus.toughness * count;
  }

  // Layer 7d — P/T modifications (additive; order does not affect the result).
  for (const effect of staticEffects) {
    power += effect.power;
    toughness += effect.toughness;
  }
  for (const modifier of object.modifiers) {
    power += modifier.power;
    toughness += modifier.toughness;
  }

  return {
    power,
    toughness,
    keywords,
    types,
    subtypes,
    colors,
    controller: object.controller,
    restrictions,
    protectionFrom: { colors: protColors, types: protTypes },
  };
}

/** @deprecated Use {@link computeCharacteristics}. */
export const characteristicsOf = computeCharacteristics;

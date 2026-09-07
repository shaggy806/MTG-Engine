/**
 * Current (as opposed to printed) characteristics of an object, computed from
 * the continuous-effects layer system (rule 613).
 *
 * Implemented: **layer 1** (copy — every read resolves through
 * `printedCardName`, so a Clone has the copied card's P/T / types / abilities),
 * **layer 6** (keyword grants), **layer 7b** (a `"self"` CDA sets base P/T),
 * **layer 7c** (counters), **layer 7d** (P/T bonuses + modifiers), timestamp-
 * ordered within a layer. NOT yet: layers 3–5 (text, type-change, colour) and
 * dependency ordering. Layer 2 (control-change) is modeled in `game.ts` by
 * reassigning `GameObject.controller`, not here.
 */

import type { AffectSpec, CardRegistry, CardType, CountSpec, Keyword } from "./cards.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameObject, GameState } from "./state.js";

export interface Characteristics {
  readonly power: number;
  readonly toughness: number;
  readonly keywords: ReadonlySet<Keyword>;
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  readonly controller: PlayerId;
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

function staticAffects(
  registry: CardRegistry,
  affects: AffectSpec,
  source: GameObject,
  target: GameObject,
): boolean {
  if (affects.scope === "self") return source.id === target.id;
  if (affects.scope === "attached") return source.attachedTo === target.id;
  // "creatures-you-control"
  if (affects.excludeSelf && source.id === target.id) return false;
  if (target.controller !== source.controller) return false;
  if (!isPrintedCreature(registry, target)) return false;
  if (
    affects.subtype !== undefined &&
    !registry.get(printedCardName(target)).subtypes.includes(affects.subtype)
  ) {
    return false;
  }
  return true;
}

interface AppliedEffect {
  readonly timestamp: number;
  readonly power: number;
  readonly toughness: number;
  readonly keywords: readonly Keyword[];
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
    for (const ability of registry.get(printedCardName(source)).static) {
      if (staticAffects(registry, ability.affects, source, target)) {
        out.push({
          timestamp: source.timestamp,
          power: ability.grantPt?.[0] ?? 0,
          toughness: ability.grantPt?.[1] ?? 0,
          keywords: ability.grantKeywords ?? [],
        });
      }
    }
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

  let power = def.power ?? 0;
  let toughness = def.toughness ?? 0;
  const keywords = new Set<Keyword>(def.keywords);

  const staticEffects =
    object.zone === "battlefield"
      ? collectStaticEffects(state, registry, object)
      : [];

  // Layer 6 — ability adds.
  for (const effect of staticEffects) {
    for (const keyword of effect.keywords) keywords.add(keyword);
  }
  for (const modifier of object.modifiers) {
    for (const keyword of modifier.keywords) keywords.add(keyword);
  }

  // Layer 7b — base P/T set by this permanent's own characteristic-defining
  // ability (rule 604.3 / 613.4b). Only a `"self"` static applies.
  if (object.zone === "battlefield") {
    for (const ability of def.static) {
      if (ability.setBasePtFromCount === undefined) continue;
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
    types: def.types,
    subtypes: def.subtypes,
    controller: object.controller,
  };
}

/** @deprecated Use {@link computeCharacteristics}. */
export const characteristicsOf = computeCharacteristics;

/**
 * Current (as opposed to printed) characteristics of an object, computed from
 * the continuous-effects layer system (rule 613).
 *
 * Milestone 5a implements **layers 6 (keyword grants) and 7 (P/T)** only:
 * static abilities of battlefield permanents, `+1/+1` / `-1/-1` counters, and
 * temporary modifiers, applied in timestamp order within a layer. NOT yet:
 * layers 1-5 (copy, control-change, text, type-change, colour), layer 7b
 * (setting base P/T), characteristic-defining abilities, or dependency ordering.
 */

import type { AffectSpec, CardRegistry, CardType, Keyword } from "./cards.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameObject, GameState } from "./state.js";

export interface Characteristics {
  readonly power: number;
  readonly toughness: number;
  readonly keywords: ReadonlySet<Keyword>;
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  readonly controller: PlayerId;
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
  return registry.get(object.cardName).types.includes("creature");
}

function staticAffects(
  registry: CardRegistry,
  affects: AffectSpec,
  source: GameObject,
  target: GameObject,
): boolean {
  if (affects.scope === "self") return source.id === target.id;
  // "creatures-you-control"
  if (affects.excludeSelf && source.id === target.id) return false;
  if (target.controller !== source.controller) return false;
  if (!isPrintedCreature(registry, target)) return false;
  if (
    affects.subtype !== undefined &&
    !registry.get(target.cardName).subtypes.includes(affects.subtype)
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
    for (const ability of registry.get(source.cardName).static) {
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
  const def = registry.get(object.cardName);

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

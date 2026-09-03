/**
 * Current (as opposed to printed) characteristics of an object.
 *
 * Milestone 4b is a P/T-only slice: printed power/toughness, plus `+1/+1`
 * counters, plus temporary modifiers. It is NOT the full layer system (no
 * type/colour/ability changing, no characteristic-defining abilities, no
 * dependency ordering) — that comes later.
 */

import type { CardRegistry } from "./cards.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

export interface Characteristics {
  readonly power: number;
  readonly toughness: number;
}

/** The bonus a named counter grants to power / toughness. */
function counterPtBonus(counter: string): { power: number; toughness: number } {
  if (counter === "+1/+1") return { power: 1, toughness: 1 };
  if (counter === "-1/-1") return { power: -1, toughness: -1 };
  return { power: 0, toughness: 0 };
}

export function characteristicsOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): Characteristics {
  const object = state.objects[id];
  const def = registry.get(object.cardName);
  let power = def.power ?? 0;
  let toughness = def.toughness ?? 0;

  for (const [counter, count] of Object.entries(object.counters)) {
    const bonus = counterPtBonus(counter);
    power += bonus.power * count;
    toughness += bonus.toughness * count;
  }
  for (const modifier of object.modifiers) {
    power += modifier.power;
    toughness += modifier.toughness;
  }

  return { power, toughness };
}

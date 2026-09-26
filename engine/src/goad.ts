/**
 * Goad (rule 701.15) — who has goaded a creature.
 *
 * A player goads a creature in one of three ways, and every question about
 * goad goes through {@link goadersOf} so that none of them is forgotten:
 *
 * - a one-shot goad — "goad target creature", "goad each creature target
 *   player controls" — lasting until that player's next turn (701.15a):
 *   `GameObject.goadedBy`;
 * - a one-shot goad **for the rest of the game** (Jon Irenicus, the tokens
 *   Rendmaw, Creaking Nest makes): `GameObject.goadedForGameBy`;
 * - a static goad (`StaticAbility.goads` — Baeloth Barrityl, Entertainer; an
 *   Aura's "enchanted creature … is goaded"), for exactly as long as the
 *   static applies. Its source's controller is the goader: 701.15b's "the
 *   controller of the permanent … that caused it to be goaded".
 *
 * Goaded is a designation, neither an ability nor a characteristic (701.15b),
 * so none of this is in the layer fold: a goaded creature that loses all its
 * abilities is still goaded (the ruling), and the combat checks
 * (`combat/eligibility.ts`) read it as attackers are declared.
 */

import type { CardRegistry, StaticAbility } from "./cards.js";
import {
  computeCharacteristics,
  computedCacheMemo,
  hasLostAbilities,
  staticConditionMet,
  staticReaches,
} from "./characteristics.js";
import type { TargetView } from "./characteristics.js";
import type { EffectAmount } from "./effects.js";
import { printedManaCost } from "./filter.js";
import { manaValue, parseManaCost } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameObject, GameState } from "./state.js";

/** One battlefield static that goads whatever it reaches. */
interface GoadingStatic {
  readonly source: GameObject;
  readonly ability: StaticAbility;
}

/**
 * Every static goad on the battlefield that functions — the
 * target-independent half of {@link goadersOf}, memoized per cache region
 * (almost always none). A source that lost its abilities has none to goad
 * with (Baeloth's ruling: "has the ability"), and a player who has left the
 * game goads nothing (rule 800.4a).
 */
function goadingStatics(state: GameState, registry: CardRegistry): readonly GoadingStatic[] {
  return computedCacheMemo("goading-statics", () => {
    const out: GoadingStatic[] = [];
    for (const id of state.zones.shared.battlefield) {
      const source = state.objects[id];
      if (source === undefined || hasLostAbilities(source)) continue;
      if (state.players[source.controller]?.hasLost === true) continue;
      for (const ability of registry.get(printedCardName(source)).static) {
        if (ability.goads === true) out.push({ source, ability });
      }
    }
    return out;
  });
}

/**
 * What a static goad's `filter` scope may compare against: its own source's
 * power, toughness or mana value, read as they are now — Baeloth's "power
 * less than Baeloth Barrityl's power" is `{ amount: { powerOf: "source" } }`.
 * Nothing else can be answered in a static, and `NaN` makes any comparison
 * with it false (fails closed, as a static's `{ amount }` does everywhere).
 */
function sourceAmount(
  state: GameState,
  registry: CardRegistry,
  source: GameObject,
): (amount: EffectAmount) => number {
  return (amount) => {
    if (typeof amount === "number") return amount;
    if (typeof amount !== "object") return Number.NaN;
    if ("powerOf" in amount && amount.powerOf === "source" && amount.doubling === undefined) {
      return computeCharacteristics(state, registry, source.id).power;
    }
    if ("toughnessOf" in amount && amount.toughnessOf === "source" && amount.doubling === undefined) {
      return computeCharacteristics(state, registry, source.id).toughness;
    }
    if ("manaValueOf" in amount && amount.manaValueOf === "source") {
      return manaValue(parseManaCost(printedManaCost(registry, source)));
    }
    return Number.NaN;
  };
}

/** Objects whose static goads are being worked out right now: a static goad
 * whose scope asks about goad itself reads this object's designations only,
 * rather than recursing. */
const inProgress = new Set<ObjectId>();

/**
 * Every player who has goaded `id` (rule 701.15), each once however many
 * ways — goading it again adds no requirement (701.15d). Empty for anything
 * not on the battlefield: goaded is a designation of a permanent, and the
 * object a permanent becomes when it leaves isn't goaded (rule 400.7).
 *
 * `view` is for a caller inside the layer fold (a static's `goaded` scope):
 * a static goad's scope is then matched as the fold sees the creature, so a
 * power or toughness clause in it (Baeloth) can't be answered there and
 * fails closed rather than folding the creature again.
 */
export function goadersOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  view: TargetView = {},
): readonly PlayerId[] {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return [];
  const out: PlayerId[] = [];
  const add = (player: PlayerId): void => {
    if (!out.includes(player)) out.push(player);
  };
  for (const player of object.goadedBy ?? []) add(player);
  for (const player of object.goadedForGameBy ?? []) add(player);
  if (inProgress.has(id)) return out;
  const statics = goadingStatics(state, registry);
  if (statics.length === 0) return out;
  inProgress.add(id);
  try {
    for (const { source, ability } of statics) {
      if (out.includes(source.controller)) continue;
      if (!staticReaches(state, registry, source, ability, object, { ...view, amount: sourceAmount(state, registry, source) })) {
        continue;
      }
      if (ability.condition !== undefined && !staticConditionMet(state, registry, source, ability.condition)) {
        continue;
      }
      add(source.controller);
    }
  } finally {
    inProgress.delete(id);
  }
  return out;
}

/** Is `id` goaded (rule 701.15b) — by anyone, whichever way? */
export function isGoaded(state: GameState, registry: CardRegistry, id: ObjectId, view: TargetView = {}): boolean {
  return goadersOf(state, registry, id, view).length > 0;
}

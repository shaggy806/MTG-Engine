/**
 * Who may attack whom, and who may block what — rules 508 and 509 as pure
 * predicates over `(state, registry, …)`.
 *
 * These were methods on `Game`, which meant the only way to ask "may this
 * creature attack that planeswalker?" was to hold the whole game. Two things
 * need to ask without one: the `attackers`/`blockers` decision modules (see
 * `decisions/`), and — through the engine's public seam — the client, which
 * today re-derives menace, Lure and goad by hand and gets goad wrong.
 *
 * Everything here is a **read**. Nothing mutates, so `Game` remains the only
 * writer of `GameState`, and `Game` keeps a one-line private delegate for each
 * of these so its ~40 non-decision callers (the `attacks` / `attacks-alone` /
 * `attack-with` trigger matchers, `endCombatStep`, `combatFirstStrikeInPlay`,
 * `dealCombatDamage`) are untouched.
 */

import type { CardDefinition, CardRegistry, Keyword } from "../cards.js";
import {
  computeCharacteristics,
  hasLostAbilities,
  objHasKeyword,
  restrictionsOf,
} from "../characteristics.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { matchesFilter } from "../filter.js";
import { printedCardName } from "../state.js";
import type { GameObject, GameState } from "../state.js";
import { permanentSource, protectionBlocks } from "../targeting.js";

/** Each landwalk keyword and the land type it walks (rule 702.14). */
export const LANDWALK: ReadonlyArray<readonly [Keyword, string]> = [
  ["plainswalk", "Plains"],
  ["islandwalk", "Island"],
  ["swampwalk", "Swamp"],
  ["mountainwalk", "Mountain"],
  ["forestwalk", "Forest"],
  ["desertwalk", "Desert"],
];

/** The land types among the lands `player` controls — what a landwalker
 * attacking them is checked against. */
export function landTypesControlledBy(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
): Set<string> {
  const types = new Set<string>();
  for (const [, landType] of LANDWALK) {
    const controls = state.zones.shared.battlefield.some((id) =>
      matchesFilter(
        state,
        registry,
        id,
        { type: "land", subtype: landType, controlledBy: "you" },
        { you: player },
      ),
    );
    if (controls) types.add(landType);
  }
  return types;
}

/** Everything the active player's attackers may be declared against: each
 * non-eliminated opponent, plus every planeswalker those opponents control
 * (rule 508.1). A planeswalker is identified by its `ObjectId`. */
export function legalDefenders(
  state: GameState,
  registry: CardRegistry,
  attacker: PlayerId,
): (PlayerId | ObjectId)[] {
  const opponents = state.turnOrder.filter(
    (player) => player !== attacker && !state.players[player].hasLost,
  );
  const planeswalkers = state.zones.shared.battlefield.filter((id) => {
    const object = state.objects[id];
    return (
      opponents.includes(object.controller) &&
      computeCharacteristics(state, registry, id).types.includes("planeswalker")
    );
  });
  return [...opponents, ...planeswalkers];
}

/** True if an attack target `id` is a planeswalker (an `ObjectId`) rather
 * than a player. */
export function isPlaneswalkerTarget(
  state: GameState,
  id: PlayerId | ObjectId,
): id is ObjectId {
  return state.objects[id as ObjectId] !== undefined;
}

/** The player who defends against an attack aimed at `target` — the target
 * itself if it's a player, or the controller of an attacked planeswalker. */
export function defendingPlayerOf(
  state: GameState,
  target: PlayerId | ObjectId,
): PlayerId {
  return isPlaneswalkerTarget(state, target)
    ? state.objects[target].controller
    : (target as PlayerId);
}

/** Battlefield creatures currently declared as attackers. */
export function currentAttackers(state: GameState): ObjectId[] {
  return state.zones.shared.battlefield.filter(
    (id) => state.objects[id].attacking != null,
  );
}

export function creatureDef(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): CardDefinition | null {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return null;
  const def = registry.get(printedCardName(object));
  // Printed OR currently a creature by a layer-4 type-change (a man-land
  // animated this turn). The returned def is still the printed one — it's
  // used for the permanent's name and ability list, while its live P/T /
  // keywords come from `computeCharacteristics`.
  if (def.types.includes("creature")) return def;
  return computeCharacteristics(state, registry, id).types.includes("creature")
    ? def
    : null;
}

export function hasSummoningSickness(object: GameObject): boolean {
  // A permanent cast from suspend "has haste" until it leaves the
  // battlefield (rule 702.62e) — it's never summoning sick.
  if (object.hastyUntilItLeaves) return false;
  return object.summoningSick;
}

export function whyCannotAttack(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  creatureId: ObjectId,
  target: PlayerId | ObjectId,
): string | null {
  const object = state.objects[creatureId];
  const def = creatureDef(state, registry, creatureId);
  if (object === undefined || def === null) {
    return `${creatureId} is not a creature on the battlefield`;
  }
  if (object.controller !== player) {
    return `${def.name} is not controlled by the active player`;
  }
  if (object.tapped) return `${def.name} is tapped and cannot attack`;
  if (objHasKeyword(state, registry, creatureId, "defender")) {
    return `${def.name} has defender and cannot attack`;
  }
  if (restrictionsOf(state, registry, creatureId).has("cant-attack")) {
    return `${def.name} can't attack`;
  }
  if (
    hasSummoningSickness(object) &&
    !objHasKeyword(state, registry, creatureId, "haste")
  ) {
    return `${def.name} has summoning sickness`;
  }
  if (!legalDefenders(state, registry, player).includes(target)) {
    return isPlaneswalkerTarget(state, target)
      ? `${def.name} can't attack that planeswalker`
      : "attackers can only attack an opponent who hasn't already lost";
  }
  // "Can't attack you or planeswalkers you control" (Vow of Duty) — "you"
  // is the controller of whatever is attached, not of the creature.
  const defendingPlayer = defendingPlayerOf(state, target);
  for (const id of state.zones.shared.battlefield) {
    const attached = state.objects[id];
    if (attached.attachedTo !== creatureId || hasLostAbilities(attached)) continue;
    if (attached.controller !== defendingPlayer) continue;
    const forbids = registry
      .get(printedCardName(attached))
      .static.some((ability) => ability.cantAttackController === true);
    if (forbids) return `${def.name} can't attack ${defendingPlayer}`;
  }
  return null;
}

export function whyCannotBlock(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  blockerId: ObjectId,
  attackerId: ObjectId,
): string | null {
  const blocker = state.objects[blockerId];
  const blockerDef = creatureDef(state, registry, blockerId);
  if (blocker === undefined || blockerDef === null) {
    return `${blockerId} is not a creature on the battlefield`;
  }
  if (blocker.controller !== player) {
    return `${blockerDef.name} is not controlled by the defender`;
  }
  if (blocker.tapped) return `${blockerDef.name} is tapped and cannot block`;
  if (restrictionsOf(state, registry, blockerId).has("cant-block")) {
    return `${blockerDef.name} can't block`;
  }

  const attacker = state.objects[attackerId];
  if (attacker === undefined || attacker.attacking === null) {
    return `${attackerId} is not attacking`;
  }
  if (objHasKeyword(state, registry, attackerId, "unblockable")) {
    const attackerDef = registry.get(printedCardName(attacker));
    return `${blockerDef.name} can't block ${attackerDef.name} (can't be blocked)`;
  }
  // Protection (rule 702.16) — can't be blocked by a matching creature.
  if (
    protectionBlocks(state, registry, attackerId, permanentSource(state, registry, blockerId))
  ) {
    const attackerDef = registry.get(printedCardName(attacker));
    return `${blockerDef.name} can't block ${attackerDef.name} (protection)`;
  }
  if (defendingPlayerOf(state, attacker.attacking) !== player) {
    const attackerDef = registry.get(printedCardName(attacker));
    return `${blockerDef.name} can't block ${attackerDef.name} — it isn't attacking ${player}`;
  }
  // Fear (702.36) / Intimidate (702.13) — blockable only by an artifact
  // creature, plus black creatures (fear) or colour-sharers (intimidate).
  const fear = objHasKeyword(state, registry, attackerId, "fear");
  const intimidate = objHasKeyword(state, registry, attackerId, "intimidate");
  if (fear || intimidate) {
    const blockerChars = computeCharacteristics(state, registry, blockerId);
    let ok = blockerChars.types.includes("artifact");
    if (!ok && fear) ok = blockerChars.colors.has("B");
    if (!ok && intimidate) {
      const attackerColors = computeCharacteristics(state, registry, attackerId).colors;
      // A colourless attacker shares no colour with anything, so only an
      // artifact creature can block it.
      for (const color of attackerColors) {
        if (blockerChars.colors.has(color)) ok = true;
      }
    }
    if (!ok) {
      const attackerDef = registry.get(printedCardName(attacker));
      return `${blockerDef.name} can't block ${attackerDef.name} (${fear ? "fear" : "intimidate"})`;
    }
  }
  // Landwalk (rule 702.14c): unblockable as long as the defending player —
  // the one declaring this block — controls a land of that type.
  const walked = LANDWALK.filter(([keyword]) => objHasKeyword(state, registry, attackerId, keyword));
  if (walked.length > 0) {
    const lands = landTypesControlledBy(state, registry, player);
    const walk = walked.find(([, landType]) => lands.has(landType));
    if (walk !== undefined) {
      const attackerDef = registry.get(printedCardName(attacker));
      return `${blockerDef.name} can't block ${attackerDef.name} (${walk[0]})`;
    }
  }
  if (
    objHasKeyword(state, registry, attackerId, "flying") &&
    !objHasKeyword(state, registry, blockerId, "flying") &&
    !objHasKeyword(state, registry, blockerId, "reach")
  ) {
    const attackerDef = registry.get(printedCardName(attacker));
    return `${blockerDef.name} can't block ${attackerDef.name} (flying)`;
  }
  return null;
}

/**
 * Goad (rule 701.38b) — "attacks a player other than you if able". The
 * requirement only bites when some *other* defender was actually legal, so
 * a goaded creature with nowhere else to go may still attack its goader.
 *
 * Shared between `whyCannotDeclareAttackers` and `legalActions`: enumerating
 * defenders without it is what let the fuzzer propose a declaration that
 * `dispatch` then refused.
 */
export function goadForbidsDefender(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  attacker: ObjectId,
  defender: PlayerId | ObjectId,
): boolean {
  const goadedBy = state.objects[attacker]?.goadedBy ?? [];
  if (goadedBy.length === 0) return false;
  if (!goadedBy.includes(defendingPlayerOf(state, defender))) return false;
  return legalDefenders(state, registry, player).some(
    (d) =>
      !goadedBy.includes(defendingPlayerOf(state, d)) &&
      whyCannotAttack(state, registry, player, attacker, d) === null,
  );
}

/**
 * Which defenders *this* attacker may legally be sent at — the enumerator
 * half of the pair whose invariant {@link goadForbidsDefender} records: offer
 * exactly what `whyCannotDeclareAttackers` will accept, or the fuzzer
 * proposes declarations `dispatch` refuses.
 *
 * Not the same as {@link legalDefenders}, which is the union across every
 * attacker. A goaded creature has to attack someone other than its goader
 * when it can, and a Vow of Duty forbids one defender to one creature — so
 * picking from the union builds a declaration the server rejects. The client
 * re-derives this by hand today and gets exactly that wrong.
 */
export function defendersForAttacker(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  attacker: ObjectId,
): (PlayerId | ObjectId)[] {
  return legalDefenders(state, registry, player).filter(
    (defender) =>
      whyCannotAttack(state, registry, player, attacker, defender) === null &&
      !goadForbidsDefender(state, registry, player, attacker, defender),
  );
}

/** Legality checks for spell / ability targets. */

import type { CardRegistry } from "./cards.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";

function isLivingCreature(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): boolean {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return false;
  return registry.get(object.cardName).types.includes("creature");
}

function isLivingPlayer(state: GameState, ref: TargetRef): boolean {
  return (
    ref.kind === "player" &&
    state.players[ref.player] !== undefined &&
    !state.players[ref.player].hasLost
  );
}

export function isLegalTarget(
  state: GameState,
  registry: CardRegistry,
  spec: TargetSpec,
  ref: TargetRef,
): boolean {
  switch (spec) {
    case "player":
      return isLivingPlayer(state, ref);
    case "creature":
      return ref.kind === "object" && isLivingCreature(state, registry, ref.object);
    case "permanent":
      return (
        ref.kind === "object" &&
        state.objects[ref.object]?.zone === "battlefield"
      );
    case "any-target":
    case "creature-or-player":
      return (
        isLivingPlayer(state, ref) ||
        (ref.kind === "object" && isLivingCreature(state, registry, ref.object))
      );
    default:
      return false;
  }
}

/** Every currently-legal target for `spec`. */
export function legalTargets(
  state: GameState,
  registry: CardRegistry,
  spec: TargetSpec,
): TargetRef[] {
  const out: TargetRef[] = [];
  for (const player of state.turnOrder) {
    const ref: TargetRef = { kind: "player", player };
    if (isLegalTarget(state, registry, spec, ref)) out.push(ref);
  }
  for (const id of state.zones.shared.battlefield) {
    const ref: TargetRef = { kind: "object", object: id };
    if (isLegalTarget(state, registry, spec, ref)) out.push(ref);
  }
  return out;
}

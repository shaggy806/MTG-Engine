/** Legality checks for spell / ability targets. */

import type { CardRegistry } from "./cards.js";
import { computeCharacteristics } from "./characteristics.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameState } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";

function isLivingCreature(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): boolean {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return false;
  return registry.get(printedCardName(object)).types.includes("creature");
}

/** A spell (a card, not an ability) currently on the stack. */
function isSpellOnStack(state: GameState, id: ObjectId): boolean {
  const object = state.objects[id];
  return object !== undefined && object.zone === "stack" && object.kind === "card";
}

/** A permanent on the battlefield whose printed types include any of `types`. */
function isPermanentOfType(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  predicate: (types: readonly string[]) => boolean,
): boolean {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return false;
  return predicate(registry.get(printedCardName(object)).types);
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
  forPlayer: PlayerId,
): boolean {
  // Hexproof (rule 702.11): a permanent with hexproof can't be the target of
  // spells or abilities an opponent of its controller controls.
  if (ref.kind === "object") {
    const object = state.objects[ref.object];
    if (
      object !== undefined &&
      object.zone === "battlefield" &&
      object.controller !== forPlayer &&
      computeCharacteristics(state, registry, ref.object).keywords.has("hexproof")
    ) {
      return false;
    }
  }
  switch (spec) {
    case "player":
      return isLivingPlayer(state, ref);
    case "creature":
      return ref.kind === "object" && isLivingCreature(state, registry, ref.object);
    case "creature-you-control":
      return (
        ref.kind === "object" &&
        isLivingCreature(state, registry, ref.object) &&
        state.objects[ref.object].controller === forPlayer
      );
    case "creature-an-opponent-controls":
      return (
        ref.kind === "object" &&
        isLivingCreature(state, registry, ref.object) &&
        state.objects[ref.object].controller !== forPlayer
      );
    case "permanent":
      return (
        ref.kind === "object" &&
        state.objects[ref.object]?.zone === "battlefield"
      );
    case "nonland-permanent":
      return (
        ref.kind === "object" &&
        isPermanentOfType(state, registry, ref.object, (t) => !t.includes("land"))
      );
    case "land":
      return (
        ref.kind === "object" &&
        isPermanentOfType(state, registry, ref.object, (t) => t.includes("land"))
      );
    case "artifact-or-enchantment":
      return (
        ref.kind === "object" &&
        isPermanentOfType(
          state,
          registry,
          ref.object,
          (t) => t.includes("artifact") || t.includes("enchantment"),
        )
      );
    case "creature-or-enchantment":
      return (
        ref.kind === "object" &&
        isPermanentOfType(
          state,
          registry,
          ref.object,
          (t) => t.includes("creature") || t.includes("enchantment"),
        )
      );
    case "spell":
      return ref.kind === "object" && isSpellOnStack(state, ref.object);
    case "creature-spell":
      return (
        ref.kind === "object" &&
        isSpellOnStack(state, ref.object) &&
        registry.get(state.objects[ref.object].cardName).types.includes("creature")
      );
    case "noncreature-spell":
      return (
        ref.kind === "object" &&
        isSpellOnStack(state, ref.object) &&
        !registry.get(state.objects[ref.object].cardName).types.includes("creature")
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
  forPlayer: PlayerId,
): TargetRef[] {
  const out: TargetRef[] = [];
  for (const player of state.turnOrder) {
    const ref: TargetRef = { kind: "player", player };
    if (isLegalTarget(state, registry, spec, ref, forPlayer)) out.push(ref);
  }
  for (const id of state.zones.shared.battlefield) {
    const ref: TargetRef = { kind: "object", object: id };
    if (isLegalTarget(state, registry, spec, ref, forPlayer)) out.push(ref);
  }
  for (const id of state.zones.shared.stack) {
    const ref: TargetRef = { kind: "object", object: id };
    if (isLegalTarget(state, registry, spec, ref, forPlayer)) out.push(ref);
  }
  return out;
}

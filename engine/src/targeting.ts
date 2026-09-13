/** Legality checks for spell / ability targets. */

import type { CardRegistry, CardType } from "./cards.js";
import { computeCharacteristics } from "./characteristics.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameState } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";

/** The colour/type identity of whatever is targeting / damaging / blocking —
 * a spell (its printed colours/types) or a permanent (its computed ones). */
export interface TargetSource {
  readonly colors: ReadonlySet<Color> | readonly Color[];
  readonly types: readonly CardType[];
}

/** Does `target`'s protection (rule 702.16) stop `source` from affecting it? */
export function protectionBlocks(
  state: GameState,
  registry: CardRegistry,
  target: ObjectId,
  source: TargetSource,
): boolean {
  const object = state.objects[target];
  if (object === undefined || object.zone !== "battlefield") return false;
  const prot = computeCharacteristics(state, registry, target).protectionFrom;
  if (prot.colors.size === 0 && prot.types.size === 0) return false;
  for (const c of source.colors) if (prot.colors.has(c)) return true;
  for (const t of source.types) if (prot.types.has(t)) return true;
  return false;
}

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
  source?: TargetSource,
): boolean {
  // Hexproof (rule 702.11): a permanent with hexproof can't be the target of
  // spells or abilities an opponent of its controller controls. Shroud (rule
  // 702.18 — needed-cards P15) is the same, but blocks *everyone*, including
  // its own controller.
  if (ref.kind === "object") {
    const object = state.objects[ref.object];
    if (object !== undefined && object.zone === "battlefield") {
      const keywords = computeCharacteristics(state, registry, ref.object).keywords;
      if (keywords.has("shroud")) return false;
      if (object.controller !== forPlayer && keywords.has("hexproof")) return false;
    }
    // Protection (rule 702.16) — can't be targeted by a matching source.
    if (source !== undefined && protectionBlocks(state, registry, ref.object, source)) {
      return false;
    }
  }
  switch (spec) {
    case "player":
      return isLivingPlayer(state, ref);
    case "opponent":
      return isLivingPlayer(state, ref) && ref.kind === "player" && ref.player !== forPlayer;
    case "creature":
      return ref.kind === "object" && isLivingCreature(state, registry, ref.object);
    case "nonblack-creature":
      return (
        ref.kind === "object" &&
        isLivingCreature(state, registry, ref.object) &&
        !computeCharacteristics(state, registry, ref.object).colors.has("B")
      );
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
    case "artifact":
      return (
        ref.kind === "object" &&
        isPermanentOfType(state, registry, ref.object, (t) => t.includes("artifact"))
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
    case "instant-or-sorcery-spell": {
      if (ref.kind !== "object" || !isSpellOnStack(state, ref.object)) return false;
      const t = registry.get(state.objects[ref.object].cardName).types;
      return t.includes("instant") || t.includes("sorcery");
    }
    case "instant-or-sorcery-in-your-graveyard": {
      if (ref.kind !== "object") return false;
      const object = state.objects[ref.object];
      if (
        object === undefined ||
        object.zone !== "graveyard" ||
        object.owner !== forPlayer ||
        object.kind !== "card"
      ) {
        return false;
      }
      const types = registry.get(printedCardName(object)).types;
      return types.includes("instant") || types.includes("sorcery");
    }
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
  source?: TargetSource,
): TargetRef[] {
  const out: TargetRef[] = [];
  for (const player of state.turnOrder) {
    const ref: TargetRef = { kind: "player", player };
    if (isLegalTarget(state, registry, spec, ref, forPlayer, source)) out.push(ref);
  }
  for (const id of state.zones.shared.battlefield) {
    const ref: TargetRef = { kind: "object", object: id };
    if (isLegalTarget(state, registry, spec, ref, forPlayer, source)) out.push(ref);
  }
  for (const id of state.zones.shared.stack) {
    const ref: TargetRef = { kind: "object", object: id };
    if (isLegalTarget(state, registry, spec, ref, forPlayer, source)) out.push(ref);
  }
  // Graveyard-targeting specs (Snapcaster Mage) — only this spec needs it, so
  // don't pay the scan for every other target.
  if (spec === "instant-or-sorcery-in-your-graveyard") {
    for (const id of state.zones.perPlayer[forPlayer].graveyard) {
      const ref: TargetRef = { kind: "object", object: id };
      if (isLegalTarget(state, registry, spec, ref, forPlayer, source)) out.push(ref);
    }
  }
  return out;
}

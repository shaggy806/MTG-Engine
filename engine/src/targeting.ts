/** Legality checks for spell / ability targets. */

import type { CardRegistry, CardType } from "./cards.js";
import { computeCharacteristics } from "./characteristics.js";
import { matchesFilter } from "./filter.js";
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
  /** The permanent the spell/ability comes from, when there is one. Only
   * `"creature-defending-player-controls"` reads it — it has to know which
   * creature is attacking to know who the defending player is. */
  readonly object?: ObjectId;
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
  // An optional slot accepts exactly what its inner spec accepts; whether it
  // may be left *empty* is a question for the caller, not for a given ref.
  if (typeof spec === "object" && spec.kind === "optional") {
    return isLegalTarget(state, registry, spec.of, ref, forPlayer, source);
  }
  // The one structured spec — a card in a graveyard (see `TargetSpec`).
  // Handled ahead of the string switch rather than inside it.
  if (typeof spec === "object") {
    if (ref.kind !== "object") return false;
    const object = state.objects[ref.object];
    if (object === undefined || object.zone !== "graveyard" || object.kind !== "card") {
      return false;
    }
    const whose = spec.whose ?? "any";
    if (whose === "you" && object.owner !== forPlayer) return false;
    if (whose === "opponent" && object.owner === forPlayer) return false;
    if (whose === "defending-player") {
      const attacker = source?.object !== undefined ? state.objects[source.object] : undefined;
      const attacking = attacker?.attacking;
      if (attacking === null || attacking === undefined) return false;
      const defender =
        state.players[attacking as PlayerId] !== undefined
          ? (attacking as PlayerId)
          : state.objects[attacking as ObjectId]?.controller;
      if (defender === undefined || object.owner !== defender) return false;
    }
    // Printed characteristics: layer effects don't reach a graveyard, and
    // `matchesFilter` degrades to printed values off the battlefield anyway.
    return (
      spec.filter === undefined ||
      matchesFilter(state, registry, ref.object, spec.filter, { you: forPlayer })
    );
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
    case "artifact-an-opponent-controls":
      return (
        ref.kind === "object" &&
        isPermanentOfType(state, registry, ref.object, (t) => t.includes("artifact")) &&
        state.objects[ref.object].controller !== forPlayer
      );
    case "nonland-permanent-an-opponent-controls":
      return (
        ref.kind === "object" &&
        isPermanentOfType(state, registry, ref.object, (t) => !t.includes("land")) &&
        state.objects[ref.object].controller !== forPlayer
      );
    case "enchantment":
      return (
        ref.kind === "object" &&
        isPermanentOfType(state, registry, ref.object, (t) => t.includes("enchantment"))
      );
    case "creature-or-enchantment-an-opponent-controls":
      return (
        ref.kind === "object" &&
        isPermanentOfType(
          state,
          registry,
          ref.object,
          (t) => t.includes("creature") || t.includes("enchantment"),
        ) &&
        state.objects[ref.object].controller !== forPlayer
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
    case "creature-defending-player-controls": {
      if (ref.kind !== "object" || source?.object === undefined) return false;
      const attacker = state.objects[source.object];
      const defending = attacker?.attacking;
      if (defending === null || defending === undefined) return false;
      // `attacking` is a player, or a planeswalker that player controls.
      const defender =
        state.players[defending as PlayerId] !== undefined
          ? (defending as PlayerId)
          : state.objects[defending as ObjectId]?.controller;
      if (defender === undefined) return false;
      return (
        isLivingCreature(state, registry, ref.object) &&
        state.objects[ref.object].controller === defender
      );
    }
    case "attacking-or-blocking-creature":
      return (
        ref.kind === "object" &&
        isLivingCreature(state, registry, ref.object) &&
        (state.objects[ref.object].attacking !== null ||
          state.objects[ref.object].blocking !== null)
      );
    case "artifact-enchantment-or-nonbasic-land-an-opponent-controls": {
      if (ref.kind !== "object") return false;
      const object = state.objects[ref.object];
      if (object === undefined || object.zone !== "battlefield" || object.controller === forPlayer) {
        return false;
      }
      const def = registry.get(printedCardName(object));
      if (def.types.includes("artifact") || def.types.includes("enchantment")) return true;
      return def.types.includes("land") && !def.supertypes.includes("basic");
    }
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
    case "opponent-or-planeswalker":
      return (
        (isLivingPlayer(state, ref) && ref.kind === "player" && ref.player !== forPlayer) ||
        (ref.kind === "object" &&
          isPermanentOfType(state, registry, ref.object, (t) => t.includes("planeswalker")))
      );
    // `any-target` deliberately falls through — keep them adjacent.
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
  // An optional slot offers the same candidates; skipping it isn't a
  // `TargetRef`, so it can't be one of them (see `isOptionalSpec`).
  if (typeof spec === "object" && spec.kind === "optional") {
    return legalTargets(state, registry, spec.of, forPlayer, source);
  }
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
  // Graveyard-targeting specs — only these need the scan, so don't pay it for
  // every other target. `instant-or-sorcery-in-your-graveyard` (Snapcaster
  // Mage) looks only at the targeting player's own graveyard; the structured
  // `card-in-graveyard` spec may reach any of them.
  if (spec === "instant-or-sorcery-in-your-graveyard") {
    for (const id of state.zones.perPlayer[forPlayer].graveyard) {
      const ref: TargetRef = { kind: "object", object: id };
      if (isLegalTarget(state, registry, spec, ref, forPlayer, source)) out.push(ref);
    }
  } else if (typeof spec === "object" && spec.kind === "card-in-graveyard") {
    for (const player of state.turnOrder) {
      for (const id of state.zones.perPlayer[player].graveyard) {
        const ref: TargetRef = { kind: "object", object: id };
        if (isLegalTarget(state, registry, spec, ref, forPlayer, source)) out.push(ref);
      }
    }
  }
  return out;
}

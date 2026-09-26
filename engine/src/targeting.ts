/** Legality checks for spell / ability targets. */

import type { CardDefinition, CardRegistry, CardType } from "./cards.js";
import type { EffectAmount } from "./effects.js";
import { computeCharacteristics, effectiveTypes } from "./characteristics.js";
import { filterReadsX, matchesFilter } from "./filter.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameState } from "./state.js";
import { isOptionalSpec, otherSlotConflict } from "./target.js";
import type { OtherThan } from "./target.js";
import type { ResolvedTargets, TargetRef, TargetSpec } from "./target.js";

/** The colour/type identity of whatever is targeting / damaging / blocking —
 * a spell (its printed colours/types) or a permanent (its computed ones). */
export interface TargetSource {
  readonly colors: ReadonlySet<Color> | readonly Color[];
  readonly types: readonly CardType[];
  /** The permanent the spell/ability comes from, when there is one —
   * `"creature-defending-player-controls"` has to know which creature is
   * attacking to know who the defending player is, and an `other` slot
   * (`than: "source"`) leaves it out. */
  readonly object?: ObjectId;
  /** For a triggered ability, the object and the player its event names —
   * what an `other` slot's `than: "trigger-object"` / `"trigger-player"`
   * leaves out. */
  readonly triggerObject?: ObjectId;
  readonly triggerPlayer?: PlayerId;
  /**
   * Answers a target filter's dynamic `NumCompare` operand (`{ amount }` —
   * see `DynamicOperand`) in the context of the spell or ability doing the
   * targeting: Clement, the Worrywort's "with lesser mana value" reads the
   * mana value of the creature whose entering fired the trigger. Supplied by
   * `Game`, which alone can evaluate an `EffectAmount`; absent ⇒ such a
   * clause matches nothing.
   */
  readonly amount?: (amount: EffectAmount) => number;
  /** The `{X}` chosen for the spell or ability doing the targeting, for a
   * target filter's `n: "x"` ("target Saga card with mana value X"). */
  readonly x?: number;
}

/** What a target filter is matched with on behalf of `source`. */
function targetFilterContext(forPlayer: PlayerId, source: TargetSource | undefined) {
  return {
    you: forPlayer,
    ...(source?.amount !== undefined ? { amount: source.amount } : {}),
    ...(source?.x !== undefined ? { x: source.x } : {}),
  };
}

/** Does this slot's filter read `{X}` (see `filterReadsX`)? Its options then
 * depend on the X chosen, so an ability with one is offered once per X —
 * see `Game.legalActions`. */
export function targetSpecReadsX(spec: TargetSpec): boolean {
  if (typeof spec !== "object") return false;
  if (spec.kind === "optional" || spec.kind === "other") return targetSpecReadsX(spec.of);
  return spec.filter !== undefined && filterReadsX(spec.filter);
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
  if (prot.colors.size === 0 && prot.types.size === 0 && prot.filters.length === 0) return false;
  for (const c of source.colors) if (prot.colors.has(c)) return true;
  for (const t of source.types) if (prot.types.has(t)) return true;
  // A quality no colour or card type can name — a subtype, multicoloured, or
  // (an empty filter) everything. `matchesFilter` needs a real object, which
  // rules out a source the caller could only describe by its characteristics;
  // `source.object` is set wherever one exists, which is every permanent and
  // every spell on the stack. Without it the colour/type clauses above have
  // already had their say and this conservatively doesn't block, rather than
  // guessing from a summary that cannot answer "is it a Human?".
  if (prot.filters.length > 0 && source.object !== undefined) {
    const from = source.object;
    if (
      prot.filters.some((filter) =>
        matchesFilter(state, registry, from, filter, { you: object.controller }),
      )
    ) {
      return true;
    }
  }
  return false;
}

function isLivingCreature(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): boolean {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return false;
  // Current types, not printed (rule 109.2): an animated Mishra's Factory or
  // a crewed Vehicle is a creature, and "target creature" can pick it.
  return effectiveTypes(state, registry, object).includes("creature");
}

/** A spell (a card, not an ability) currently on the stack. */
function isSpellOnStack(state: GameState, id: ObjectId): boolean {
  const object = state.objects[id];
  return object !== undefined && object.zone === "stack" && object.kind === "card";
}

/** A permanent on the battlefield whose current types satisfy `predicate`. */
function isPermanentOfType(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  predicate: (types: readonly string[]) => boolean,
): boolean {
  const object = state.objects[id];
  if (object === undefined || object.zone !== "battlefield") return false;
  return predicate(effectiveTypes(state, registry, object));
}

/** Is `ref` the one thing an `other` slot must differ from? An "other than
 * slot n" relation isn't this ref's alone to answer — `otherSlotConflict`
 * checks the pair. */
function excludedAsOther(than: OtherThan, ref: TargetRef, source: TargetSource | undefined): boolean {
  if (typeof than === "object" || source === undefined) return false;
  if (than === "trigger-player") {
    return ref.kind === "player" && source.triggerPlayer !== undefined && ref.player === source.triggerPlayer;
  }
  const id = than === "source" ? source.object : source.triggerObject;
  return ref.kind === "object" && id !== undefined && ref.object === id;
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
  opts: {
    /** The slot was filled by the triggering event, not chosen: a saboteur's
     * "that player" (Hypnotic Specter). Nothing is *targeting* it, so
     * hexproof, shroud and protection don't apply — only whether the slot
     * can hold it at all. */
    readonly notTargeted?: boolean;
  } = {},
): boolean {
  const targeted = opts.notTargeted !== true;
  // Hexproof (rule 702.11): a permanent with hexproof can't be the target of
  // spells or abilities an opponent of its controller controls. Shroud (rule
  // 702.18 — needed-cards P15) is the same, but blocks *everyone*, including
  // its own controller.
  if (!targeted) {
    // Nothing to check here; fall through to the shape of the slot.
  } else if (ref.kind === "object") {
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
  } else if (
    // A player with hexproof (Lazotep Plating's "you … gain hexproof") can't
    // be the target of spells or abilities their opponents control, which at
    // a multiplayer table is everyone else (rule 702.11d).
    ref.player !== forPlayer &&
    state.hexproofPlayers?.includes(ref.player) === true
  ) {
    return false;
  }
  // An optional slot accepts exactly what its inner spec accepts; whether it
  // may be left *empty* is a question for the caller, not for a given ref.
  if (typeof spec === "object" && spec.kind === "optional") {
    return isLegalTarget(state, registry, spec.of, ref, forPlayer, source, opts);
  }
  // "Another target …": the inner spec, less what it has to differ from.
  if (typeof spec === "object" && spec.kind === "other") {
    if (excludedAsOther(spec.than ?? "source", ref, source)) return false;
    return isLegalTarget(state, registry, spec.of, ref, forPlayer, source, opts);
  }
  // A filtered battlefield permanent (see `TargetSpec`). Like the graveyard
  // spec below, handled ahead of the string switch rather than inside it.
  if (typeof spec === "object" && spec.kind === "permanent") {
    if (ref.kind !== "object") return false;
    const object = state.objects[ref.object];
    if (object === undefined || object.zone !== "battlefield") return false;
    const whose = spec.whose ?? "any";
    if (whose === "you" && object.controller !== forPlayer) return false;
    if (whose === "opponent" && object.controller === forPlayer) return false;
    if (whose === "trigger-player" && (source?.triggerPlayer === undefined || object.controller !== source.triggerPlayer)) {
      return false;
    }
    return matchesFilter(state, registry, ref.object, spec.filter, targetFilterContext(forPlayer, source));
  }
  // A filtered spell on the stack.
  if (typeof spec === "object" && spec.kind === "spell") {
    if (ref.kind !== "object" || !isSpellOnStack(state, ref.object)) return false;
    const whose = spec.whose ?? "any";
    const controller = state.objects[ref.object].controller;
    if (whose === "you" && controller !== forPlayer) return false;
    if (whose === "opponent" && controller === forPlayer) return false;
    return matchesFilter(state, registry, ref.object, spec.filter, targetFilterContext(forPlayer, source));
  }
  // The structured graveyard spec.
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
      matchesFilter(state, registry, ref.object, spec.filter, targetFilterContext(forPlayer, source))
    );
  }
  switch (spec) {
    case "player":
      return isLivingPlayer(state, ref);
    case "opponent":
      return isLivingPlayer(state, ref) && ref.kind === "player" && ref.player !== forPlayer;
    case "opponent-whose-turn-it-is":
      return (
        isLivingPlayer(state, ref) &&
        ref.kind === "player" &&
        ref.player !== forPlayer &&
        ref.player === state.turnOrder[state.turn.activePlayerIndex]
      );
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
    case "land-you-control":
      return (
        ref.kind === "object" &&
        isPermanentOfType(state, registry, ref.object, (t) => t.includes("land")) &&
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
    case "artifact-or-creature":
      return (
        ref.kind === "object" &&
        isPermanentOfType(
          state,
          registry,
          ref.object,
          (t) => t.includes("artifact") || t.includes("creature"),
        )
      );
    case "nonartifact-creature":
      return (
        ref.kind === "object" &&
        isPermanentOfType(
          state,
          registry,
          ref.object,
          (t) => t.includes("creature") && !t.includes("artifact"),
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
    case "creature-attacking-you": {
      if (ref.kind !== "object" || !isLivingCreature(state, registry, ref.object)) return false;
      const attacking = state.objects[ref.object].attacking;
      if (attacking === null || attacking === undefined) return false;
      // `attacking` is a player, or a planeswalker that player controls.
      return (
        attacking === forPlayer ||
        state.objects[attacking as ObjectId]?.controller === forPlayer
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
      const types = effectiveTypes(state, registry, object);
      if (types.includes("artifact") || types.includes("enchantment")) return true;
      return types.includes("land") && !def.supertypes.includes("basic");
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
    case "enchantment-instant-or-sorcery-spell": {
      if (ref.kind !== "object" || !isSpellOnStack(state, ref.object)) return false;
      const t = registry.get(state.objects[ref.object].cardName).types;
      return t.includes("enchantment") || t.includes("instant") || t.includes("sorcery");
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
    case "player-or-planeswalker":
      // "**any** player" — including yourself (Clan Defiance). The narrower
      // `opponent-or-planeswalker` above is a different printed wording.
      return (
        isLivingPlayer(state, ref) ||
        (ref.kind === "object" &&
          isPermanentOfType(state, registry, ref.object, (t) => t.includes("planeswalker")))
      );
    // `any-target` deliberately falls through — keep them adjacent.
    case "any-target":
      // Rule 115.4: a creature, a player, a planeswalker or a battle.
      // Battles aren't modeled; the rest are. `dealDamage` already takes
      // loyalty off a planeswalker it damages.
      return (
        isLivingPlayer(state, ref) ||
        (ref.kind === "object" &&
          (isLivingCreature(state, registry, ref.object) ||
            isPermanentOfType(state, registry, ref.object, (t) => t.includes("planeswalker"))))
      );
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
  if (typeof spec === "object" && spec.kind === "other") {
    const than = spec.than ?? "source";
    return legalTargets(state, registry, spec.of, forPlayer, source).filter(
      (ref) => !excludedAsOther(than, ref, source),
    );
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
    // Only the graveyards `whose` can reach: a "your graveyard" spell in hand
    // is enumerated on every `legalActions` call, and late in a game each
    // graveyard holds dozens of cards.
    const whose = spec.whose ?? "any";
    for (const player of state.turnOrder) {
      if (whose === "you" && player !== forPlayer) continue;
      if (whose === "opponent" && player === forPlayer) continue;
      for (const id of state.zones.perPlayer[player].graveyard) {
        const ref: TargetRef = { kind: "object", object: id };
        if (isLegalTarget(state, registry, spec, ref, forPlayer, source)) out.push(ref);
      }
    }
  }
  return out;
}

/**
 * The colour/type identity of a permanent (its computed values), as a
 * {@link TargetSource}.
 *
 * The source may be gone by the time an ability it put on the stack resolves
 * (rule 608.2b — e.g. a creature Saw-in-Half'd, or a Miirym copy exiled at
 * end step, in response to its own trigger). We don't retain last-known
 * characteristics, so degrade to a neutral source (no colours / types — no
 * protection or DEBT clause matches).
 */
export function permanentSource(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): TargetSource {
  if (state.objects[id] === undefined) return { colors: new Set(), types: [] };
  const c = computeCharacteristics(state, registry, id);
  // `object` is carried so a spec can ask about the source itself — see
  // `"creature-defending-player-controls"`.
  return { colors: c.colors, types: c.types, object: id };
}

/** The colour/type identity of a card that isn't on the battlefield — a spell
 * on the stack, or one being cast. Its printed characteristics are the whole
 * story, which is what makes this the two-line sibling of
 * {@link permanentSource}. */
export function cardSource(def: CardDefinition, object?: ObjectId): TargetSource {
  return {
    colors: def.colors,
    types: def.types,
    // Carried when the caller knows which object the card *is* — a spell on
    // the stack, or a card being cast. Only filter-based protection reads it
    // (see `protectionBlocks`): "protection from multicolored" has to ask
    // about the spell itself, and printed colours alone can't answer it once
    // something has changed them.
    ...(object !== undefined ? { object } : {}),
  };
}

/**
 * Why `chosen` isn't a valid filling of `specs`, or `null` if it is.
 *
 * The one place that decides a **hole** is allowed: a slot declared
 * `{ kind: "optional" }` ("up to one target creature") may be left empty,
 * every other slot must be filled with a currently-legal target, and the
 * arity must match either way — "up to two" is two optional slots, not a
 * variable count, so the shape of `targets` always mirrors the spec list
 * and each effect's `target:` index stays a fixed position.
 */
export function invalidTargetReason(
  state: GameState,
  registry: CardRegistry,
  specs: readonly TargetSpec[],
  chosen: ResolvedTargets,
  player: PlayerId,
  name: string,
  source?: TargetSource,
): string | null {
  if (chosen.length !== specs.length) {
    return `${name} takes ${specs.length} target(s), got ${chosen.length}`;
  }
  for (let i = 0; i < specs.length; i += 1) {
    const ref = chosen[i];
    if (ref === undefined) {
      if (isOptionalSpec(specs[i])) continue;
      return `${name} needs a target for slot ${i}`;
    }
    if (!isLegalTarget(state, registry, specs[i], ref, player, source)) {
      return `illegal target for ${name}`;
    }
  }
  const conflict = otherSlotConflict(specs, chosen);
  if (conflict !== null) {
    return `${name}'s target ${conflict.slot + 1} must be another than its target ${conflict.than + 1}`;
  }
  return null;
}

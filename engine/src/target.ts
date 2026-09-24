/** Reference types for spell / ability targets. Pure data, no logic. */

import type { CardFilter } from "./filter.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";

export type TargetRef =
  | { readonly kind: "player"; readonly player: PlayerId }
  | { readonly kind: "object"; readonly object: ObjectId };

/** What a target slot is allowed to point at. */
export type TargetSpec =
  | "any-target"
  | "creature"
  /** A creature whose current (computed, layer 5) colours don't include black
   * — Doom Blade / Terror. */
  | "nonblack-creature"
  | "creature-you-control"
  | "creature-an-opponent-controls"
  | "player"
  /** A player other than the one choosing the target ("target opponent" —
   * Iridescent Vinelasher). */
  | "opponent"
  | "creature-or-player"
  /** An opponent, or any planeswalker (Theater of Horrors' "target opponent
   * or planeswalker"). */
  | "opponent-or-planeswalker"
  /** *Any* player — yourself included — or any planeswalker (Clan Defiance's
   * "target player or planeswalker"). A different printed wording from
   * `opponent-or-planeswalker`, not a synonym. */
  | "player-or-planeswalker"
  | "permanent"
  | "nonland-permanent"
  | "land"
  /** A land whose controller is the one choosing — the Karoo lands' "return a
   * land you control to its owner's hand". Modelled as a target because the
   * engine has no "choose a permanent you control" for a return; the
   * divergence (targeting vs choosing) only shows on a land with hexproof or
   * shroud, of which the pool has none. */
  | "land-you-control"
  | "artifact"
  /** An artifact an opponent controls (Vandalblast: "target artifact you
   * don't control"). */
  | "artifact-an-opponent-controls"
  | "artifact-or-enchantment"
  | "creature-or-enchantment"
  /** Putrefy, Bedevil — a single slot that takes either type. */
  | "artifact-or-creature"
  /** Go for the Throat. "Nonartifact" is a restriction on the creature, not a
   * second type, so it can't be expressed by the pair above. */
  | "nonartifact-creature"
  /** A bare enchantment (Aura Mutation: "target enchantment"). */
  | "enchantment"
  /** A creature or enchantment an opponent controls (Feed the Swarm). */
  | "creature-or-enchantment-an-opponent-controls"
  /** A nonland permanent an opponent controls (Cyclonic Rift's unkicked
   * mode: "target nonland permanent you don't control"). */
  | "nonland-permanent-an-opponent-controls"
  /** A creature currently attacking or blocking (Eiganjo, Seat of the
   * Empire's Channel — "target attacking or blocking creature"). */
  | "attacking-or-blocking-creature"
  /** A creature attacking *the targeting player* or a planeswalker they
   * control (Soul Snare). Narrower than `attacking-or-blocking-creature`:
   * at a 3-4 player table someone else's attacker is not your problem. */
  | "creature-attacking-you"
  /**
   * A creature controlled by the player *this ability's source is attacking*
   * — Tyrant's Familiar's "target creature defending player controls".
   *
   * Needs `TargetSource.object` to know which creature is attacking, and so
   * only means anything on an ability whose source is an attacker. In a
   * two-player game this coincides with "a creature an opponent controls";
   * at a 3-4 player table it does not, which is why it isn't spelled that way.
   */
  | "creature-defending-player-controls"
  /** An artifact, enchantment, or nonbasic land an opponent controls
   * (Boseiju, Who Endures's Channel). */
  | "artifact-enchantment-or-nonbasic-land-an-opponent-controls"
  /** A spell on the stack (a card, not an ability). */
  | "spell"
  | "creature-spell"
  | "noncreature-spell"
  /** An instant or sorcery spell on the stack (Twincast). */
  | "instant-or-sorcery-spell"
  /** Swan Song — the three types it can counter. */
  | "enchantment-instant-or-sorcery-spell"
  /** An instant or sorcery card in the targeting player's graveyard
   * (Snapcaster Mage — ROADMAP Phase 6b). */
  | "instant-or-sorcery-in-your-graveyard"
  /**
   * A permanent on the battlefield matching an arbitrary `CardFilter` — the
   * general form, for the shapes that aren't worth their own literal.
   *
   * "Target creature with flying" / "without flying" (Clan Defiance), "target
   * Dragon you control", "target creature with power 4 or greater": these
   * multiply combinatorially, the way graveyard targeting does, so the string
   * literals above stop converging. The literals stay for the common shapes —
   * they read better at the call site and most of the pool already uses them.
   *
   * `whose` defaults to `"any"`.
   */
  | {
      readonly kind: "permanent";
      readonly whose?: "any" | "you" | "opponent";
      readonly filter: CardFilter;
    }
  /**
   * A card in a graveyard — the general form for a graveyard the way
   * `permanent` is for the battlefield.
   *
   * Every other spec is a string literal because the set of "permanent on the
   * battlefield" shapes is small and enumerable. Graveyard targeting isn't:
   * cards differ on *whose* graveyard and on an arbitrary card filter
   * (Withered Wretch takes any card in any graveyard; Cemetery Reaper a
   * creature card; Haven of the Spirit Dragon a Dragon creature card in
   * **your** graveyard), and spelling each combination as its own literal
   * would not converge.
   *
   * `whose` defaults to `"any"`. `filter` is matched against the card's
   * printed characteristics — layer effects don't reach a graveyard.
   */
  | {
      readonly kind: "card-in-graveyard";
      /** `"defending-player"` reads the graveyard of whoever the ability's
       * source is currently attacking (Rakshasa Debaser), and so needs
       * `TargetSource.object` — the same way
       * `"creature-defending-player-controls"` does. */
      readonly whose?: "any" | "you" | "opponent" | "defending-player";
      readonly filter?: CardFilter;
    }
  /**
   * A spell on the stack matching a filter — Red Elemental Blast's "counter
   * target **blue** spell", Mental Misstep's "target spell **with mana value
   * 1**". The filter reads the spell as it is on the stack: its printed
   * colours and types, and a mana value that counts its chosen {X} (rule
   * 202.3e). The string specs above stay for the unfiltered shapes.
   */
  | {
      readonly kind: "spell";
      readonly filter: CardFilter;
    }
  /**
   * A slot that may be left empty — "up to one target creature" (Ajani,
   * Caller of the Pride), "up to two target creatures you don't control"
   * (Hate Mirage), "fights up to one target creature" (Primal Might).
   *
   * "Up to N" is spelled as N optional slots rather than a variable count, so
   * the shape of `targets` still matches the shape of the spec list and every
   * effect's `target:` index stays a fixed position. A skipped slot travels
   * as `null` in `Action.targets` and arrives at resolution as `undefined`,
   * which is what an effect reading `ctx.targets[i]` already checks for.
   */
  | { readonly kind: "optional"; readonly of: TargetSpec };

/**
 * Targets as the engine carries them internally, once a dispatched action has
 * been normalized: a **hole** (`undefined`) where an optional slot was
 * skipped. `undefined` rather than `null` on purpose — every effect already
 * guards `ctx.targets[i]` with an `undefined` check, because an out-of-range
 * index reads that way, so skipped slots need no new handling anywhere.
 */
export type ResolvedTargets = readonly (TargetRef | undefined)[];

/** Turn a dispatched action's `null` holes into `undefined` ones. */
export function normalizeTargets(
  chosen: readonly (TargetRef | null)[] | undefined,
): ResolvedTargets {
  return (chosen ?? []).map((ref) => ref ?? undefined);
}

/** The underlying spec a (possibly optional) slot accepts. */
export function requiredSpec(spec: TargetSpec): TargetSpec {
  return typeof spec === "object" && spec.kind === "optional" ? spec.of : spec;
}

/** May this slot be left empty? */
export function isOptionalSpec(spec: TargetSpec): boolean {
  return typeof spec === "object" && spec.kind === "optional";
}

/**
 * A short human label for a target slot, for a UI prompt ("choose a
 * creature"). The string specs are already their own label; the structured
 * one needs building.
 */
export function describeTargetSpec(spec: TargetSpec | string): string {
  if (typeof spec === "string") return spec;
  if (spec.kind === "optional") return `${describeTargetSpec(spec.of)} (optional)`;
  if (spec.kind === "spell") {
    const colour = spec.filter.colors?.length === 1 ? `${COLOUR_WORD[spec.filter.colors[0]]} ` : "";
    return `${colour}${spec.filter.type ?? ""}${spec.filter.type === undefined ? "" : " "}spell`;
  }
  if (spec.kind === "permanent") {
    const noun = spec.filter.type ?? spec.filter.subtype ?? "permanent";
    if (spec.whose === "you") return `${noun} you control`;
    if (spec.whose === "opponent") return `${noun} an opponent controls`;
    return noun;
  }
  const whose =
    spec.whose === "you"
      ? "your graveyard"
      : spec.whose === "opponent"
        ? "an opponent's graveyard"
        : "a graveyard";
  const what = spec.filter?.type ?? "card";
  return `${what} in ${whose}`;
}

const COLOUR_WORD: Readonly<Record<Color, string>> = {
  W: "white",
  U: "blue",
  B: "black",
  R: "red",
  G: "green",
};

export const targetsPlayer = (ref: TargetRef, player: PlayerId): boolean =>
  ref.kind === "player" && ref.player === player;

export const targetsObject = (ref: TargetRef, object: ObjectId): boolean =>
  ref.kind === "object" && ref.object === object;

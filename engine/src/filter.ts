/**
 * `CardFilter` — a pure predicate over a game object and its *computed*
 * characteristics (rule 613 layers baked in via `computeCharacteristics`).
 *
 * Every clause that is present must match (logical AND). It is the shared
 * vocabulary for "which objects does this effect / trigger / target / search
 * apply to", generalizing the old `{ type?, subtype? }` `ZoneChoiceFilter`.
 * Introduced in ROADMAP Phase 2; reused by every later phase.
 *
 * Off the battlefield (a library / graveyard card) `computeCharacteristics`
 * degrades to printed values, which is what a library search / graveyard
 * filter wants. A permanent that has *left* the battlefield is matched as it
 * last existed there only when the caller asks (`FilterContext.lastKnown` /
 * `.snapshot` — a dies trigger's filter, a resolving ability's "if it was …").
 */

import {
  computeCharacteristics,
  effectiveColors,
  effectiveSubtypes,
  effectiveTypes,
  hasAnyAbility,
  hasLostAbilities,
  hasManaAbility,
} from "./characteristics.js";
import type { CardRegistry, CardType, Keyword, Supertype } from "./cards.js";
import type { EffectAmount, ThisWayKind } from "./effects.js";
import { isGoaded } from "./goad.js";
import type { Color, ManaCost, ManaFromSpec } from "./mana.js";
import { COLORS, manaOriginMatches, manaValue, parseManaCost } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { activePlayerOf, printedCardName } from "./state.js";
import type { GameObject, GameState, LastKnownInfo, ZoneType } from "./state.js";
import { hasSubtype } from "./subtypes.js";
import { thisWayEntries } from "./this-way.js";

/**
 * A numeric comparison clause, e.g. `{ op: "lte", n: 2 }` = "≤ 2".
 *
 * `n: "x"` reads the `{X}` chosen for the spell or ability that's applying
 * the filter (Steel Hellkite: "each nonland permanent with mana value X").
 * It needs `FilterContext.x`; without one it compares against 0.
 *
 * `n` may also be a {@link DynamicOperand}: a number that isn't printed on the
 * card but read off the game when the filter is evaluated.
 */
export interface NumCompare {
  readonly op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
  readonly n: number | "x" | DynamicOperand;
}

/**
 * The right-hand side of a {@link NumCompare} that is read when the filter is
 * evaluated rather than written down.
 *
 * - `{ amount }` is any {@link EffectAmount}, evaluated in the context of the
 *   spell or ability applying the filter — Clement, the Worrywort's "target
 *   creature you control **with lesser mana value**" is
 *   `{ op: "lt", n: { amount: { manaValueOf: "trigger-object" } } }`. It is
 *   answered by `FilterContext.amount`; where nothing supplies one (a static
 *   ability's condition, which has no triggering object or resolution) the
 *   comparison **fails closed** — the object doesn't match. Nothing freezes
 *   it: a target filter is re-read when the target is rechecked on
 *   resolution, and an effect's filter when that effect applies.
 * - `{ own }` is a characteristic of the very object being matched — "each
 *   creature spell with toughness **greater than its power**" is
 *   `toughness: { op: "gt", n: { own: "power" } }`. Needs no context.
 */
export type DynamicOperand =
  | { readonly amount: EffectAmount }
  | { readonly own: "power" | "toughness" | "manaValue" };

/**
 * Does any clause of `filter` compare against `{X}` — `n: "x"`, or an
 * `{ amount: "x" }` operand? A target filter that does (Rydia, Summoner of
 * Mist's "target Saga card with mana value X") has no fixed set of options
 * until X is chosen.
 */
export function filterReadsX(filter: CardFilter): boolean {
  const readsX = (cmp: NumCompare | undefined): boolean =>
    cmp !== undefined &&
    (cmp.n === "x" || (isDynamicOperand(cmp.n) && "amount" in cmp.n && cmp.n.amount === "x"));
  return (
    readsX(filter.manaValue) ||
    readsX(filter.manaSpent) ||
    readsX(filter.counters?.compare) ||
    readsX(filter.power) ||
    readsX(filter.toughness) ||
    readsX(filter.basePower) ||
    readsX(filter.baseToughness) ||
    readsX(filter.coloredManaSymbols) ||
    readsX(filter.cardTypeCount) ||
    (filter.nameDiffersFromEach !== undefined && filterReadsX(filter.nameDiffersFromEach)) ||
    (filter.anyOf ?? []).some(filterReadsX)
  );
}

/** Does a `NumCompare` carry a {@link DynamicOperand}? */
export function isDynamicOperand(n: NumCompare["n"]): n is DynamicOperand {
  return typeof n === "object" && n !== null;
}

/**
 * `value <op> n`. `dynamic` answers a {@link DynamicOperand}; one it can't
 * answer (`undefined`, or no `dynamic` at all) makes the comparison false.
 */
export function compareNum(
  value: number,
  cmp: NumCompare,
  x = 0,
  dynamic?: (operand: DynamicOperand) => number | undefined,
): boolean {
  const n = cmp.n === "x" ? x : isDynamicOperand(cmp.n) ? dynamic?.(cmp.n) : cmp.n;
  if (n === undefined) return false;
  switch (cmp.op) {
    case "eq":
      return value === n;
    case "ne":
      return value !== n;
    case "lt":
      return value < n;
    case "lte":
      return value <= n;
    case "gt":
      return value > n;
    case "gte":
      return value >= n;
    default:
      return false;
  }
}

export interface CardFilter {
  /** Must have ALL of these card types. */
  readonly types?: readonly CardType[];
  /** Convenience for a single required type. */
  readonly type?: CardType;
  /** Must have NONE of these card types. */
  readonly notTypes?: readonly CardType[];
  /** Must have AT LEAST ONE of these card types — an OR (Takenuma, Abandoned
   * Mire's Channel: "a creature or planeswalker card" — needed-cards-adjacent,
   * mirrors `subtypes`' OR semantics). */
  readonly typesAnyOf?: readonly CardType[];
  /** Must have this subtype (creature type, land type, …). */
  readonly subtype?: string;
  /** Must have AT LEAST ONE of these subtypes — an OR (Farseek: "a Plains,
   * Island, Swamp, or Mountain card"; a checkland's "a Mountain or a Forest"). */
  readonly subtypes?: readonly string[];
  /** Must have NONE of these subtypes — Cruel Revival's "target **non-Zombie**
   * creature", Crippling Fear's "creatures that aren't of the chosen type". */
  readonly notSubtypes?: readonly string[];
  /** Must have this supertype (`"legendary"`, `"basic"`, …). */
  readonly supertype?: Supertype;
  /** Exact true printed card name. */
  readonly name?: string;
  /** Current colours must include ALL of these. */
  readonly colors?: readonly Color[];
  /** Current colours must include NONE of these (Doom Blade: `["B"]`). */
  readonly notColors?: readonly Color[];
  /** Must be colourless. */
  readonly colorless?: boolean;
  /** Must be multicoloured — two or more colours (rule 105.4). `false` matches
   * mono-coloured *and* colourless, which is what "nonmulticolored" means.
   * Not expressible as `colors`, which asks for specific ones. */
  readonly multicolored?: boolean;
  readonly manaValue?: NumCompare;
  /** How much mana was actually spent to cast it (The Emperor of Palamecia:
   * "if at least four mana was spent to cast it") — see
   * `GameObject.manaSpent`. `0` for something that wasn't cast. */
  readonly manaSpent?: NumCompare;
  /** "If mana from an artifact was spent to cast it" (`{ type: "artifact"
   * }`), "…from a Treasure" (`{ subtype: "Treasure" }`): at least `atLeast`
   * (default 1) units of the mana spent to cast it were made by a source
   * matching every field given, as that source was when it made the mana —
   * see `GameObject.manaSpentFrom`. Something that wasn't cast matches
   * nothing. */
  readonly manaFrom?: ManaFromSpec & { readonly atLeast?: number };
  /**
   * How many counters of a given kind are on the object — Rishkar's "each
   * creature you control **with a counter on it**", Undying's "if it had no
   * +1/+1 counters on it".
   *
   * `kind` omitted counts every counter of every kind, which is what a bare
   * "with a counter on it" means.
   */
  readonly counters?: { readonly kind?: string; readonly compare: NumCompare };
  /** Currently attacking (Kangee's Lieutenant: "attacking creatures with
   * flying get +1/+1"). */
  readonly attacking?: boolean;
  /** Currently blocking — the mirror of `attacking` (Kangee, Sky Warden's
   * "blocking creatures with flying get +0/+2"). */
  readonly blocking?: boolean;
  /**
   * Is (or isn't) **goaded** (rule 701.15b), by anyone and whichever way — a
   * one-shot goad, one for the rest of the game, or a static one (`goadersOf`
   * in `goad.ts`). One that has left the battlefield is asked as it last was:
   * Baeloth Barrityl's "whenever a goaded attacking or blocking creature
   * dies". Matched from inside the layer fold (a static's scope), a static
   * goad whose own scope reads power or toughness can't be seen.
   */
  readonly goaded?: boolean;
  /** Is (or isn't) **suspected** (rule 701.60 — `GameObject.suspectedAt`):
   * Nelly Borca's "goad all suspected creatures". One that has left the
   * battlefield is asked as it last was. */
  readonly suspected?: boolean;
  readonly power?: NumCompare;
  readonly toughness?: NumCompare;
  /**
   * Base power / base toughness (rule 613.4b) — Duskana, the Rage Mother's
   * "each creature you control with base power and toughness 2/2" is both,
   * `{ op: "eq", n: 2 }`. The printed values, or what a characteristic-
   * defining ability or an effect that sets them made them ("becomes a 4/4",
   * "has base power and toughness 2/2"), before counters and every "+N/+N" —
   * see `Characteristics.basePower`. Like `power`, can't be answered from
   * inside the layer fold (a static's scope) and fails closed there.
   */
  readonly basePower?: NumCompare;
  readonly baseToughness?: NumCompare;
  /**
   * Has (or hasn't) a mana ability (rule 605.1) — activated or triggered, its
   * own or granted: Raggadragga, Goreguts Boss's "each creature you control
   * **with a mana ability** gets +2/+2". See `characteristics.ts`'s
   * `hasManaAbility`. Answered inside the layer fold too, so a static may be
   * scoped by it.
   */
  readonly hasManaAbility?: boolean;
  /**
   * Has any ability at all (rule 113) — `false` is "with **no abilities**"
   * (Jasmine Boreal of the Seven): no keyword, ability or spell instructions
   * of its own (unless it lost them) and none granted to it. See
   * `characteristics.ts`'s `hasAnyAbility`. A granted keyword can come from
   * any static, so this can't be answered from inside the layer fold and
   * fails closed there.
   */
  readonly hasAbilities?: boolean;
  /**
   * Has (or hasn't) `{X}` in its mana cost — Zaxara, the Exemplary's "a spell
   * **with {X} in its mana cost**". The mana cost of what it is now: a copy's
   * is the copied card's, and the back face of a transformed permanent has
   * none (rule 712.8e — only its mana *value* comes from the front).
   */
  readonly xInManaCost?: boolean;
  /**
   * How many coloured mana symbols are in its mana cost — Omnath, Locus of
   * All's "three or more colored mana symbols in its mana cost" is `{ op:
   * "gte", n: 3 }`. A hybrid or Phyrexian symbol is one coloured symbol
   * (rules 107.4e–f), `{2/W}` included; `{C}`, `{X}`, generic and snow
   * symbols aren't coloured. Read from the same mana cost as `xInManaCost`.
   */
  readonly coloredManaSymbols?: NumCompare;
  /**
   * How many card types it has — Rendmaw, Creaking Nest's "a card with **two
   * or more card types**" is `{ op: "gte", n: 2 }`: an artifact creature, an
   * enchantment creature, a land creature. Its current types, like `type`.
   */
  readonly cardTypeCount?: NumCompare;
  /**
   * Its name is different from the name of every battlefield permanent
   * matching this filter (rule 201.2c) — Light-Paws, Emperor's Voice's "an
   * Aura card … **with a different name than each Aura you control**" is `{
   * subtype: "Aura", controlledBy: "you" }`, matched from the same "you".
   * True when nothing matches. A permanent that matches it itself shares its
   * own name, so never qualifies. Can't be answered from inside the layer fold
   * and fails closed there.
   */
  readonly nameDiffersFromEach?: CardFilter;
  /**
   * Is of the creature type chosen for the permanent applying the filter (its
   * `chosenCreatureType`, via `FilterContext.source`) — Morophon, the
   * Boundless's "other creatures you control **of the chosen type** get
   * +1/+1". A changeling is of whatever type was chosen. With no source, or
   * nothing chosen for it yet, nothing matches.
   */
  readonly ofChosenType?: true;
  /** Controlled by the filtering player (`"you"`), anyone else
   * (`"opponent"`), or whoever's turn it is (`"active-player"` — "creatures
   * **the active player** controls", "each creature attacking player
   * controls" outside combat). The active player is read off the state, so
   * it is the same answer whoever is asking. */
  readonly controlledBy?: "you" | "opponent" | "active-player";
  /** Owned by the filtering player / anyone else (zone-agnostic, for graveyards). */
  readonly ownedBy?: "you" | "opponent";
  readonly keyword?: Keyword;
  /** Must NOT have this keyword (Magmaquake: "each creature without flying" —
   * needed-cards P13). */
  readonly notKeyword?: Keyword;
  readonly tapped?: boolean;
  readonly token?: boolean;
  /** Is (or isn't) a commander (rule 903.3) — Fierce Guardianship's "if you
   * control a commander" gate. */
  readonly isCommander?: boolean;
  /** Must NOT have this supertype — "nonlegendary", "nonbasic". */
  readonly notSupertype?: Supertype;
  /** Must NOT be this card — "a card not named …". */
  readonly notName?: string;
  /** Has an Equipment attached to it, whoever controls the Equipment (rule
   * 301.5). */
  readonly equipped?: boolean;
  /** Has an Aura attached to it, whoever controls the Aura (rule 303.4). */
  readonly enchanted?: boolean;
  /** Has an Aura attached to it that **you** control — Eriette of the
   * Charmed Apple's "each creature that's enchanted by an Aura you
   * control". */
  readonly enchantedBy?: "you";
  /**
   * Is **modified** (rule 700.9): has a counter of any kind on it, is
   * equipped, or is enchanted by an Aura its *own controller* controls
   * (Chishiro, the Shattered Blade). An opponent's Aura doesn't count; an
   * opponent's Equipment does.
   */
  readonly modified?: boolean;
  /**
   * Is (or isn't) a card in a graveyard that was put there **from a library
   * this turn** — Captain N'ghathrod's "target artifact or creature card in an
   * opponent's graveyard that was put there from a library this turn". Milling
   * is the usual way; surveil and other library-to-graveyard moves count too,
   * and a discarded or destroyed card never does. See
   * `GameObject.putIntoGraveyardFromLibraryOnTurn`.
   */
  readonly putIntoGraveyardFromLibraryThisTurn?: boolean;
  /** Entered the battlefield this turn (or didn't) — "creatures that entered
   * this turn", "a creature that didn't enter this turn". A card anywhere
   * but the battlefield hasn't; one that has left is asked as it last was. */
  readonly enteredThisTurn?: boolean;
  /** Was declared as an attacker this turn (or wasn't) — Kratos, God of
   * War's "creatures that player controls that didn't attack this turn". A
   * permanent that left the battlefield and came back is a new object that
   * hasn't; one that has left is asked as it last was. */
  readonly attackedThisTurn?: boolean;
  /** It entered the battlefield (this stint) as a spell that was cast and
   * resolved — "if it was cast" (see `GameObject.entry`). */
  readonly cast?: boolean;
  /** …cast by **you** — "if you cast it" (Anti-Venom, Rocco, Tiamat). */
  readonly castBy?: "you";
  /** …cast from this zone — "if it was cast from a graveyard". */
  readonly castFrom?: ZoneType;
  /** It entered the battlefield from this zone — "enters from exile" (Fire
   * Lord Zuko), "came from a graveyard" (a spell's entry comes from the
   * stack; `castFrom` says where it was cast). */
  readonly enteredFrom?: ZoneType;
  /** It was (or wasn't) put onto the battlefield by an ability of the
   * permanent applying the filter, this stint of it — Kodama of the East
   * Tree's "if it wasn't put onto the battlefield with this ability". Needs
   * `FilterContext.source`; without one, nothing was. */
  readonly putThereBySource?: boolean;
  /**
   * Shares at least one card type with the permanent sacrificed to pay for
   * (or earlier in) the spell or ability applying this filter — "a permanent
   * that shares a card type with it" (Braids, Arisen Nightmare), read from
   * the sacrificed permanent as it last existed on the battlefield. Bound to
   * a plain `typesAnyOf` as the effect applies (`bindDynamicCompares`); with
   * nothing sacrificed, or anywhere else, it matches nothing.
   */
  readonly sharesCardTypeWith?: "sacrificed";
  /**
   * One of the objects the spell or ability now resolving has done this to
   * (see `ThisWayKind`) — choosing among the cards just moved: "you may put
   * a creature card milled this way into your hand", "put a permanent card
   * from among them onto the battlefield" after an exile. Between
   * resolutions nothing matches.
   */
  readonly thisWay?: ThisWayKind;
  /**
   * At least one of these filters must match, as well as every other clause
   * here — the "or" a flat clause list can't say: historic ("artifact,
   * legendary, or Saga"), "enchanted or equipped", "black and/or red".
   */
  readonly anyOf?: readonly CardFilter[];
}

export interface FilterContext {
  /** Whose perspective `"you"` / `"opponent"` are evaluated from. */
  readonly you: PlayerId;
  /** The `{X}` of the spell or ability applying this filter, for a
   * `NumCompare` written as `{ n: "x" }`. Defaults to 0. */
  readonly x?: number;
  /**
   * Read an object that has just left the battlefield as it last existed
   * there (rule 603.10a) — for a trigger filter matched against the permanent
   * whose leaving fired it, as the event happens. Every clause then reads its
   * `GameObject.lastKnown` snapshot: the controller it had, the types and
   * subtypes an effect had given it, its counters, keywords, power. No effect
   * on an object that is on the battlefield.
   */
  readonly lastKnown?: boolean;
  /**
   * Match this snapshot of the object instead of the object as it is now —
   * last-known information the caller has already picked out for a
   * particular departure from the battlefield (a resolving ability's "if it
   * was a Saproling", "if the sacrificed creature was a commander"). Wins
   * over `lastKnown`, and answers even for a token that has ceased to exist.
   */
  readonly snapshot?: LastKnownInfo;
  /** Evaluates a `NumCompare`'s `{ amount }` operand in the context of
   * whatever is applying the filter (its source, controller, triggering
   * object, {X}, targets). Absent ⇒ such a comparison fails closed. */
  readonly amount?: (amount: EffectAmount) => number;
  /** The permanent whose trigger or ability is applying the filter — what
   * `putThereBySource` compares against. */
  readonly source?: ObjectId;
  /**
   * The object is being matched from *inside* the layer fold that computes
   * its characteristics — a static ability's `filter` scope (see
   * `AffectSpec`). Nothing here may fold them again, so a type or subtype
   * clause reads `types` / `subtypes` when given (the types granted so far,
   * inside layer 4) and a keyword clause reads `keywords` (printed ones, less
   * ability loss, when absent). A power or toughness clause, or an `{ own }`
   * power or toughness operand, can't be answered and fails closed.
   */
  readonly layered?: {
    readonly types?: readonly CardType[] | undefined;
    readonly subtypes?: readonly string[] | undefined;
    readonly keywords?: (() => ReadonlySet<Keyword>) | undefined;
  };
}

/** What is attached to `id` on the battlefield, for the attachment clauses.
 * Attachments leave with the permanent, so off the battlefield it's none —
 * which is why a leaving permanent's snapshot records them first
 * (`LastKnownInfo.equipped`). */
export function attachmentsOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): {
  equipped: boolean;
  enchanted: boolean;
  enchantedByController: boolean;
  enchantedBy: PlayerId[];
} {
  const out = {
    equipped: false,
    enchanted: false,
    enchantedByController: false,
    enchantedBy: [] as PlayerId[],
  };
  const host = state.objects[id];
  if (host === undefined || host.zone !== "battlefield") return out;
  for (const other of state.zones.shared.battlefield) {
    const o = state.objects[other];
    if (o === undefined || o.attachedTo !== id) continue;
    const subtypes = effectiveSubtypes(state, registry, o);
    if (subtypes.includes("Equipment")) out.equipped = true;
    if (subtypes.includes("Aura")) {
      out.enchanted = true;
      if (o.controller === host.controller) out.enchantedByController = true;
      if (!out.enchantedBy.includes(o.controller)) out.enchantedBy.push(o.controller);
    }
  }
  return out;
}

/**
 * The mana cost an object's mana value is read from: the face that's up,
 * except that a transforming double-faced permanent with its back face up
 * uses its **front** face's (rule 712.8e — a flipped Bloodline Keeper is
 * still mana value 4, though Lord of Lineage prints no cost). A modal DFC's
 * back face is a card face you cast or play, and uses its own.
 */
export function printedManaCost(registry: CardRegistry, object: GameObject): string | null {
  const def = registry.get(printedCardName(object));
  const front = def.faces?.[0];
  if (def.transform === true && front !== undefined && front !== def.name && registry.has(front)) {
    return registry.get(front).manaCost;
  }
  return def.manaCost;
}

/** The mana cost the face named `name` prints — what "{X} in its mana cost"
 * and "colored mana symbols in its mana cost" read. Unlike
 * {@link printedManaCost}, which is for mana value, a transformed back face's
 * own: it has none (rule 712.8e). */
function ownManaCost(registry: CardRegistry, name: string): ManaCost {
  return parseManaCost(registry.has(name) ? registry.get(name).manaCost : null);
}

/** How many coloured mana symbols a cost has (rule 107.4): each coloured pip,
 * and each hybrid or Phyrexian symbol once (107.4e–f — every one has a
 * colour, `{2/W}` included). */
export function coloredManaSymbolsIn(cost: ManaCost): number {
  return (
    COLORS.reduce((n, color) => n + cost.colored[color], 0) +
    cost.hybrid.filter((pip) => pip.some((option) => option.kind === "color")).length
  );
}

/** An object's mana value. On the stack, {X} counts as the value chosen for
 * it (rule 202.3e) — a Fireball cast for 5 is a mana value 6 spell.
 * Everywhere else it's 0. */
function manaValueOfObject(registry: CardRegistry, object: GameObject): number {
  const cost = parseManaCost(printedManaCost(registry, object));
  return manaValue(cost) + (object.zone === "stack" ? cost.x * Math.max(0, object.xValue ?? 0) : 0);
}

/** Does object `id` satisfy every clause of `filter`?
 *
 * With a snapshot in play (`FilterContext.lastKnown` / `.snapshot`) every
 * clause reads it instead of the object: one code path, so no clause can be
 * answered from the snapshot in one place and from the card in the
 * graveyard in another. */
export function matchesFilter(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  filter: CardFilter,
  ctx: FilterContext,
): boolean {
  const object: GameObject | undefined = state.objects[id];
  const lki: LastKnownInfo | undefined =
    ctx.snapshot ??
    (ctx.lastKnown !== true
      ? undefined
      : object === undefined
        ? state.ceasedTokens?.[id]
        : object.zone !== "battlefield"
          ? object.lastKnown
          : undefined);
  // Exactly one of the two describes the object from here on.
  const live = lki === undefined ? object : undefined;
  if (live === undefined && lki === undefined) return false;

  // What a player who has left the game owns, anywhere, and a permanent
  // they control, takes no further part in it: nothing counts it, targets
  // it, returns it or sweeps it up.
  //
  // Rule 800.4a removes a departing player's objects from the game. Here they
  // stay where they are — an eliminated player's battlefield sits there for
  // everyone to read, as it would at a table — but they are gone, which is
  // the half the rules are about (`Game.leaveGame`, `Game.inGame`); the
  // client tints the quadrant so nobody mistakes them for live.
  if (
    live !== undefined &&
    (state.players[live.owner]?.hasLost === true ||
      (live.zone === "battlefield" && state.players[live.controller]?.hasLost === true))
  ) {
    return false;
  }
  // "Shares a card type with the sacrificed creature" is bound to plain
  // types by the effect applying it (`bindDynamicCompares`); left unbound —
  // anywhere nothing could answer it — it matches nothing.
  if (filter.sharesCardTypeWith !== undefined) return false;
  if (filter.thisWay !== undefined && !thisWayEntries(state, filter.thisWay).some((e) => e.object === id)) {
    return false;
  }

  // Types, subtypes and colours are self-contained (layers 4 / 3 / 5 come only
  // from the object's own modifiers), so they're answered without the layer
  // fold. Only `keyword` / `power` / `toughness` need external statics — and
  // the fold is expensive enough that it's worth deferring: a static
  // ability's condition (Kird Ape's "you control a Forest") runs this over the
  // whole battlefield every time anything reads its characteristics.
  const layered = live !== undefined ? ctx.layered : undefined;
  const types =
    live !== undefined
      ? (layered?.types ?? effectiveTypes(state, registry, live))
      : lki!.types;
  if (filter.type !== undefined && !types.includes(filter.type)) return false;
  if (filter.types !== undefined && !filter.types.every((t) => types.includes(t))) {
    return false;
  }
  if (filter.notTypes !== undefined && filter.notTypes.some((t) => types.includes(t))) {
    return false;
  }
  if (filter.typesAnyOf !== undefined && !filter.typesAnyOf.some((t) => types.includes(t))) {
    return false;
  }
  if (
    filter.subtype !== undefined ||
    filter.subtypes !== undefined ||
    filter.notSubtypes !== undefined ||
    filter.ofChosenType !== undefined
  ) {
    // Through `hasSubtype`, never `includes`: a changeling's list carries one
    // marker for every creature type (see `subtypes.ts`).
    const subtypes =
      live !== undefined
        ? (layered?.subtypes ?? effectiveSubtypes(state, registry, live))
        : lki!.subtypes;
    if (filter.subtype !== undefined && !hasSubtype(subtypes, filter.subtype)) return false;
    if (
      filter.subtypes !== undefined &&
      !filter.subtypes.some((s) => hasSubtype(subtypes, s))
    ) {
      return false;
    }
    if (
      filter.notSubtypes !== undefined &&
      filter.notSubtypes.some((s) => hasSubtype(subtypes, s))
    ) {
      return false;
    }
    if (filter.ofChosenType === true) {
      const chosen = ctx.source === undefined ? null : state.objects[ctx.source]?.chosenCreatureType;
      if (chosen == null || !hasSubtype(subtypes, chosen)) return false;
    }
  }
  const name = live !== undefined ? printedCardName(live) : lki!.name;
  if (filter.supertype !== undefined || filter.notSupertype !== undefined) {
    const supertypes = live !== undefined ? registry.get(name).supertypes : lki!.supertypes;
    if (filter.supertype !== undefined && !supertypes.includes(filter.supertype)) return false;
    if (filter.notSupertype !== undefined && supertypes.includes(filter.notSupertype)) {
      return false;
    }
  }
  if (filter.name !== undefined && name !== filter.name) return false;
  if (filter.notName !== undefined && name === filter.notName) return false;

  if (
    filter.colors !== undefined ||
    filter.notColors !== undefined ||
    filter.colorless === true ||
    filter.multicolored !== undefined
  ) {
    const colors: ReadonlySet<Color> =
      live !== undefined ? effectiveColors(registry, live) : new Set(lki!.colors);
    if (filter.colors !== undefined && !filter.colors.every((col) => colors.has(col))) {
      return false;
    }
    if (filter.notColors !== undefined && filter.notColors.some((col) => colors.has(col))) {
      return false;
    }
    if (filter.colorless === true && colors.size > 0) return false;
    if (filter.multicolored !== undefined && colors.size >= 2 !== filter.multicolored) {
      return false;
    }
  }

  if (filter.blocking !== undefined) {
    const blocking = live !== undefined ? live.blocking !== null : lki!.blocking;
    if (blocking !== filter.blocking) return false;
  }
  if (filter.attacking !== undefined) {
    // Off the battlefield `attacking` has been cleared by the move, and only
    // a snapshot still knows (Kardur's "whenever an attacking creature dies").
    const attacking = live !== undefined ? live.attacking !== null : lki!.attacking;
    if (attacking !== filter.attacking) return false;
  }
  if (filter.suspected !== undefined) {
    const suspected =
      live !== undefined ? live.zone === "battlefield" && live.suspectedAt !== undefined : lki!.suspected === true;
    if (suspected !== filter.suspected) return false;
  }
  if (filter.goaded !== undefined) {
    // Goaded is a designation of a permanent (rule 701.15b): nothing off the
    // battlefield is, bar what a snapshot says it was as it left.
    const goaded =
      live !== undefined
        ? isGoaded(
            state,
            registry,
            id,
            layered === undefined
              ? {}
              : { inFold: true, types: layered.types, subtypes: layered.subtypes, keywords: layered.keywords },
          )
        : (lki!.goaders?.length ?? 0) > 0;
    if (goaded !== filter.goaded) return false;
  }
  // A `NumCompare` operand read off the game: `{ own }` from this object,
  // `{ amount }` from whoever is applying the filter.
  let own: { readonly power: number; readonly toughness: number } | undefined = lki;
  const manaValueNow = (): number =>
    live !== undefined ? manaValueOfObject(registry, live) : lki!.manaValue;
  const dynamic = (operand: DynamicOperand): number | undefined => {
    if ("amount" in operand) return ctx.amount?.(operand.amount);
    if (operand.own === "manaValue") return manaValueNow();
    if (own === undefined && layered !== undefined) return undefined;
    own ??= computeCharacteristics(state, registry, id);
    return operand.own === "power" ? own.power : own.toughness;
  };
  const counters = live !== undefined ? live.counters : lki!.counters;
  if (filter.counters !== undefined) {
    const held = filter.counters.kind === undefined
      ? Object.values(counters).reduce((n, v) => n + (v ?? 0), 0)
      : (counters[filter.counters.kind] ?? 0);
    if (!compareNum(held, filter.counters.compare, ctx.x, dynamic)) return false;
  }
  if (filter.manaValue !== undefined) {
    if (!compareNum(manaValueNow(), filter.manaValue, ctx.x, dynamic)) return false;
  }
  if (filter.xInManaCost !== undefined || filter.coloredManaSymbols !== undefined) {
    const cost = ownManaCost(registry, live !== undefined ? printedCardName(live) : lki!.name);
    if (filter.xInManaCost !== undefined && cost.x > 0 !== filter.xInManaCost) return false;
    if (
      filter.coloredManaSymbols !== undefined &&
      !compareNum(coloredManaSymbolsIn(cost), filter.coloredManaSymbols, ctx.x, dynamic)
    ) {
      return false;
    }
  }
  if (
    filter.cardTypeCount !== undefined &&
    !compareNum(types.length, filter.cardTypeCount, ctx.x, dynamic)
  ) {
    return false;
  }
  if (filter.manaSpent !== undefined) {
    const spent = live !== undefined ? live.manaSpent : lki!.manaSpent;
    if (!compareNum(spent ?? 0, filter.manaSpent, ctx.x, dynamic)) return false;
  }
  if (filter.manaFrom !== undefined) {
    const spec = filter.manaFrom;
    const origins = (live !== undefined ? live.manaSpentFrom : lki!.manaSpentFrom) ?? [];
    if (origins.filter((origin) => manaOriginMatches(origin, spec)).length < (spec.atLeast ?? 1)) {
      return false;
    }
  }
  // Cheap, purely-positional clauses before the expensive fold below.
  const controller = live !== undefined ? live.controller : lki!.controller;
  const owner = live !== undefined ? live.owner : lki!.owner;
  if (filter.controlledBy === "you" && controller !== ctx.you) return false;
  if (filter.controlledBy === "opponent" && controller === ctx.you) return false;
  if (filter.controlledBy === "active-player" && controller !== activePlayerOf(state)) return false;
  if (filter.ownedBy === "you" && owner !== ctx.you) return false;
  if (filter.ownedBy === "opponent" && owner === ctx.you) return false;
  if (filter.tapped !== undefined) {
    const tapped = live !== undefined ? live.tapped : lki!.tapped;
    if (tapped !== filter.tapped) return false;
  }
  if (filter.token !== undefined) {
    const token = live !== undefined ? live.isToken : lki!.isToken;
    if (token !== filter.token) return false;
  }
  if (filter.isCommander !== undefined) {
    const commander = live !== undefined ? live.isCommander : lki!.isCommander;
    if (commander !== filter.isCommander) return false;
  }
  if (filter.enteredThisTurn !== undefined) {
    const turn = live !== undefined ? live.enteredBattlefieldOnTurn : (lki!.enteredOnTurn ?? null);
    if ((turn === state.turn.number) !== filter.enteredThisTurn) return false;
  }
  if (
    filter.cast !== undefined ||
    filter.castBy !== undefined ||
    filter.castFrom !== undefined ||
    filter.enteredFrom !== undefined ||
    filter.putThereBySource !== undefined
  ) {
    const entry = live !== undefined ? (live.zone === "battlefield" ? live.entry : undefined) : lki!.entry;
    if (filter.cast !== undefined && (entry?.cast !== undefined) !== filter.cast) return false;
    if (filter.castBy === "you" && entry?.cast?.by !== ctx.you) return false;
    if (filter.castFrom !== undefined && entry?.cast?.from !== filter.castFrom) return false;
    if (filter.enteredFrom !== undefined && entry?.from !== filter.enteredFrom) return false;
    if (filter.putThereBySource !== undefined) {
      const by = entry?.by;
      const asker = ctx.source === undefined ? undefined : state.objects[ctx.source];
      const byIt = by !== undefined && asker !== undefined && by.source === asker.id && by.timestamp === asker.timestamp;
      if (byIt !== filter.putThereBySource) return false;
    }
  }
  if (filter.attackedThisTurn !== undefined) {
    const attacked =
      live !== undefined
        ? live.zone === "battlefield" && live.attackedThisTurn === true
        : lki!.attackedOnTurn === state.turn.number;
    if (attacked !== filter.attackedThisTurn) return false;
  }
  if (filter.putIntoGraveyardFromLibraryThisTurn !== undefined) {
    // A snapshot is of a permanent, which didn't come from a library.
    const milled =
      live !== undefined &&
      live.zone === "graveyard" &&
      live.putIntoGraveyardFromLibraryOnTurn === state.turn.number;
    if (milled !== filter.putIntoGraveyardFromLibraryThisTurn) return false;
  }
  if (
    filter.equipped !== undefined ||
    filter.enchanted !== undefined ||
    filter.enchantedBy !== undefined ||
    filter.modified !== undefined
  ) {
    const attached = live !== undefined ? attachmentsOf(state, registry, id) : lki!;
    if (filter.equipped !== undefined && attached.equipped !== filter.equipped) return false;
    if (filter.enchanted !== undefined && attached.enchanted !== filter.enchanted) return false;
    if (filter.enchantedBy === "you" && !(attached.enchantedBy ?? []).includes(ctx.you)) return false;
    if (filter.modified !== undefined) {
      const modified =
        Object.values(counters).some((n) => (n ?? 0) > 0) ||
        attached.equipped ||
        attached.enchantedByController;
      if (modified !== filter.modified) return false;
    }
  }
  if (
    filter.anyOf !== undefined &&
    !filter.anyOf.some((each) =>
      matchesFilter(state, registry, id, each, lki === undefined ? ctx : { ...ctx, snapshot: lki }),
    )
  ) {
    return false;
  }
  if (filter.hasManaAbility !== undefined) {
    const has =
      live !== undefined
        ? hasManaAbility(
            state,
            registry,
            live,
            layered !== undefined
              ? { inFold: true, types: layered.types, subtypes: layered.subtypes, keywords: layered.keywords }
              : {},
          )
        : lki!.hasManaAbility;
    if (has !== filter.hasManaAbility) return false;
  }
  // These can't be answered from inside the layer fold (see each clause).
  if (
    layered !== undefined &&
    (filter.hasAbilities !== undefined || filter.nameDiffersFromEach !== undefined)
  ) {
    return false;
  }
  if (filter.hasAbilities !== undefined) {
    const has = live !== undefined ? hasAnyAbility(state, registry, live) : lki!.hasAbilities;
    if (has !== filter.hasAbilities) return false;
  }
  if (filter.nameDiffersFromEach !== undefined) {
    // Rule 201.2c, against every battlefield permanent the inner filter
    // finds — from the same side, but as each permanent is now.
    const inner = filter.nameDiffersFromEach;
    const innerCtx: FilterContext = {
      you: ctx.you,
      ...(ctx.x !== undefined ? { x: ctx.x } : {}),
      ...(ctx.amount !== undefined ? { amount: ctx.amount } : {}),
      ...(ctx.source !== undefined ? { source: ctx.source } : {}),
    };
    const shared = state.zones.shared.battlefield.some((other) => {
      const object = state.objects[other];
      return (
        object !== undefined &&
        printedCardName(object) === name &&
        matchesFilter(state, registry, other, inner, innerCtx)
      );
    });
    if (shared) return false;
  }

  // Only these need the layer fold (external anthems / keyword grants).
  if (
    filter.power !== undefined ||
    filter.toughness !== undefined ||
    filter.basePower !== undefined ||
    filter.baseToughness !== undefined ||
    filter.keyword !== undefined ||
    filter.notKeyword !== undefined
  ) {
    if (layered !== undefined) {
      // Inside the fold: keywords as far as it has got, P/T not at all.
      if (
        filter.power !== undefined ||
        filter.toughness !== undefined ||
        filter.basePower !== undefined ||
        filter.baseToughness !== undefined
      ) {
        return false;
      }
      const keywords =
        layered.keywords?.() ??
        new Set(hasLostAbilities(live!) ? [] : registry.get(name).keywords);
      if (filter.keyword !== undefined && !keywords.has(filter.keyword)) return false;
      if (filter.notKeyword !== undefined && keywords.has(filter.notKeyword)) return false;
      return true;
    }
    const c: {
      readonly power: number;
      readonly toughness: number;
      readonly basePower: number;
      readonly baseToughness: number;
      readonly keywords: ReadonlySet<Keyword>;
    } =
      lki !== undefined
        ? {
            power: lki.power,
            toughness: lki.toughness,
            basePower: lki.basePower,
            baseToughness: lki.baseToughness,
            keywords: new Set(lki.keywords),
          }
        : computeCharacteristics(state, registry, id);
    own = c;
    if (filter.power !== undefined && !compareNum(c.power, filter.power, ctx.x, dynamic)) {
      return false;
    }
    if (filter.toughness !== undefined && !compareNum(c.toughness, filter.toughness, ctx.x, dynamic)) {
      return false;
    }
    if (filter.basePower !== undefined && !compareNum(c.basePower, filter.basePower, ctx.x, dynamic)) {
      return false;
    }
    if (
      filter.baseToughness !== undefined &&
      !compareNum(c.baseToughness, filter.baseToughness, ctx.x, dynamic)
    ) {
      return false;
    }
    if (filter.keyword !== undefined && !c.keywords.has(filter.keyword)) return false;
    if (filter.notKeyword !== undefined && c.keywords.has(filter.notKeyword)) return false;
  }

  return true;
}

/**
 * One battlefield permanent a count or an aggregate reads, and how many
 * permanents it stands for: a compacted token stack is every token in it
 * (`GameObject.stackCount`), so anything that counts permanents counts them
 * all.
 */
export interface WeightedMatch {
  readonly id: ObjectId;
  readonly weight: number;
}

/**
 * The permanents among `ids` that `keep` accepts, each weighted by how many
 * permanents it is — less the ones `except` names. "Other" and "except
 * target" leave out *one permanent*, not one object: an excluded member of a
 * stack of five leaves the other four counted, and an excluded ordinary
 * permanent drops out entirely.
 */
export function weightedMatches(
  state: GameState,
  ids: readonly ObjectId[],
  keep: (id: ObjectId) => boolean,
  except: readonly ObjectId[] = [],
): WeightedMatch[] {
  const out: WeightedMatch[] = [];
  for (const id of ids) {
    const object = state.objects[id];
    if (object === undefined || !keep(id)) continue;
    const weight = (object.stackCount ?? 1) - (except.includes(id) ? 1 : 0);
    if (weight > 0) out.push({ id, weight });
  }
  return out;
}

/** What an aggregate reads off each permanent: its power, toughness or mana
 * value, or how many counters of one kind are on it — Tom Bombadil's "four
 * or more **lore counters among Sagas you control**" is a sum of `{
 * counters: "lore" }`. */
export type AggregateOf = "power" | "toughness" | "mana-value" | { readonly counters: string };

/**
 * A sum or a maximum over matching battlefield permanents (rule 208 /
 * 202.3): Ghalta's "the **total power** of creatures you control", Finneas's
 * "creatures you control have total power 10 or greater", "the **greatest
 * mana value** among permanents you control".
 *
 * - `sum` counts a token stack once per token in it — twenty 1/1 Goblins in
 *   one stack are 20 power, exactly as twenty separate tokens would be.
 * - `max` is 0 over no permanents at all (there is nothing to have a
 *   greatest value), which is what every printed "greatest … among" means
 *   on an empty board.
 *
 * `filter` is evaluated from the ability's controller's perspective, as
 * `countOf` is. `excludeSelf` is "**other** creatures you control".
 */
export interface AggregateSpec {
  readonly aggregate: "sum" | "max";
  readonly of: AggregateOf;
  readonly filter: CardFilter;
  readonly excludeSelf?: boolean;
}

/** One permanent's current power, toughness or mana value — computed, so
 * anthems and counters count; mana value from the printed cost, with `{X}`
 * as 0 off the stack (rule 202.3e) — or the counters of a kind on it. */
export function aggregateValueOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  of: AggregateOf,
): number {
  if (typeof of === "object") return state.objects[id]?.counters[of.counters] ?? 0;
  if (of === "mana-value") {
    const object = state.objects[id];
    return object === undefined ? 0 : manaValue(parseManaCost(printedManaCost(registry, object)));
  }
  const c = computeCharacteristics(state, registry, id);
  return of === "power" ? c.power : c.toughness;
}

/** Fold `matches` into one number — see {@link AggregateSpec}. The raw
 * value: a negative power lowers a sum, and callers that need a
 * non-negative amount clamp it themselves. */
export function aggregateOver(
  state: GameState,
  registry: CardRegistry,
  matches: readonly WeightedMatch[],
  aggregate: "sum" | "max",
  of: AggregateOf,
): number {
  if (matches.length === 0) return 0;
  if (aggregate === "sum") {
    return matches.reduce((n, m) => n + aggregateValueOf(state, registry, m.id, of) * m.weight, 0);
  }
  return matches.reduce(
    (best, m) => Math.max(best, aggregateValueOf(state, registry, m.id, of)),
    -Infinity,
  );
}

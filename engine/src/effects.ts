/**
 * The effect layer: a small declarative vocabulary that the engine interprets,
 * plus the `ResolutionContext` API that both declarative effects and imperative
 * `resolve` scripts (the escape hatch) call into.
 *
 * The engine ({@link Game}) supplies the concrete {@link EffectApi} implementation
 * — these functions just describe *what* to do. A `target` field is an index
 * into the spell's or ability's chosen targets, or the literal `"source"`.
 */

import type { CardType, Keyword, StaticAbility, StaticCondition } from "./cards.js";
import type { CardFilter } from "./filter.js";
import type { Color, ManaType } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef, TargetSpec } from "./target.js";

export type EffectTargetRef = number | "source";
export type PtDuration = "end-of-turn" | "permanent";
/** A numeric amount in an effect: a literal, `"x"` for the value chosen for
 * `{X}` when the spell/ability was put on the stack (`ResolutionContext.x`),
 * or a live count of battlefield permanents matching a filter, evaluated from
 * the effect's controller's perspective (Scourge of Valkas: `{ countOf:
 * { subtype: "Dragon", controlledBy: "you" } }`; Craterhoof Behemoth:
 * `{ countOf: { type: "creature", controlledBy: "you" } }`). */
export type EffectAmount =
  | number
  | "x"
  | { readonly countOf: CardFilter }
  /** A numeric quantity the triggering event supplies (ROADMAP P4b): the power
   * of the entering creature (Terror of the Peaks) or, for a "deals combat
   * damage to a player" trigger, the damage dealt (Old Gnawbone — "create that
   * many Treasure tokens"). Snapshotted when the trigger is detected; `0`
   * outside a triggered-ability resolution. */
  | { readonly triggerValue: true };

/** @deprecated Use {@link CardFilter} directly — kept as an alias so existing
 * `look-and-choose` / `matchesZoneChoiceFilter` call sites still type-check. */
export type ZoneChoiceFilter = CardFilter;

/** Which players an "each" / mass effect reaches. */
export type PlayerScope = "each-player" | "each-opponent" | "you";

/** A declarative effect. Grows as milestones add vocabulary. */
export type EffectSpec =
  | {
      /** Apply several effects in order, sharing the same targets and X.
       * (e.g. Blightning: 3 damage to target player *and* that player
       * discards two cards.) */
      readonly kind: "sequence";
      readonly effects: readonly EffectSpec[];
    }
  | { readonly kind: "damage"; readonly amount: EffectAmount; readonly target: number }
  | {
      /** `mana: "any-color"` — one mana of any of the five colours, the
       * player's choice (Arcane Signet, Command Tower, Treasure). During
       * cost payment the planner picks the colour it needs; a standalone
       * activation (holding priority, not paying anything) just adds white. */
      readonly kind: "add-mana";
      readonly mana: ManaType | "any-color";
      readonly amount: number;
      /** Damage this mana ability deals to its controller when it's used (a
       * painland's coloured tap — Karplusan Forest: "{T}: Add {R} or {G}.
       * Karplusan Forest deals 1 damage to you."). The auto-payer prefers a
       * painless option and only reaches for this when it must. */
      readonly painToController?: number;
    }
  | { readonly kind: "draw"; readonly amount: EffectAmount }
  | {
      readonly kind: "gain-life";
      readonly amount: number;
      /** Who gains — the effect's controller (default), or a scope. */
      readonly who?: PlayerScope;
    }
  | {
      /** Life loss (Zulaport Cutthroat: "each opponent loses 1 life"). */
      readonly kind: "lose-life";
      readonly amount: number;
      readonly who?: PlayerScope;
    }
  | { readonly kind: "tap"; readonly target: number }
  | { readonly kind: "untap"; readonly target: number }
  | { readonly kind: "destroy"; readonly target: number }
  | {
      /** Destroy every battlefield permanent matching `filter` (Wrath of God:
       * `{ type: "creature" }`). Indestructible / 903.9a handled per-permanent
       * downstream. */
      readonly kind: "destroy-all";
      readonly filter: CardFilter;
    }
  | {
      /** Deal `amount` damage to every battlefield permanent matching `filter`
       * (Pyroclasm: 2 to each creature). The source of the damage is the
       * resolving spell/ability. */
      readonly kind: "damage-all";
      readonly filter: CardFilter;
      readonly amount: EffectAmount;
    }
  | {
      /** Each affected player sacrifices `count` permanents matching `filter`
       * that they control (Diabolic Edict — `who: "target"`; Fleshbag
       * Marauder — `who: "each-player"`). Raises a `sacrifice` decision per
       * player who has a real choice; auto-resolves otherwise. */
      readonly kind: "sacrifice";
      readonly who: PlayerScope | "target";
      readonly filter: CardFilter;
      readonly count: number;
      /** Exclude the effect's own source ("sacrifice **another** permanent" —
       * Korvold). needed-cards P6. */
      readonly exceptSource?: boolean;
    }
  | {
      /** `targets[a]` and `targets[b]` each deal damage equal to their power
       * to the other (rule 701.12). With `oneSided`, only `a` deals to `b`
       * (Rabid Bite). */
      readonly kind: "fight";
      readonly a: number;
      readonly b: number;
      readonly oneSided?: boolean;
    }
  | {
      /** Return a target permanent to its owner's hand (rule 614-style bounce). */
      readonly kind: "return-to-hand";
      readonly target: number;
    }
  | {
      /** Put a target permanent into exile. */
      readonly kind: "exile";
      readonly target: number;
    }
  | {
      /** Counter a target spell on the stack — it moves to its owner's
       * graveyard without resolving (rule 701.5). */
      readonly kind: "counter";
      readonly target: number;
    }
  | {
      /** Gain control of a target permanent (rule 613.1b, layer 2 — modeled
       * here by reassigning `controller`). `untilEndOfTurn` reverts it in the
       * cleanup step (Act of Treason); otherwise it lasts until the permanent
       * changes zones. */
      readonly kind: "gain-control";
      readonly target: number;
      readonly untilEndOfTurn: boolean;
    }
  | {
      /** Target player puts the top `amount` cards of their library into
       * their graveyard. `target: "you"` = the effect's controller, with no
       * target slot (Aftermath Analyst's "mill three cards"). */
      readonly kind: "mill";
      readonly target: number | "you";
      readonly amount: EffectAmount;
    }
  | {
      /** Return every card matching `filter` from the effect's controller's
       * graveyard to `destination` (Splendid Reclamation: all land cards to
       * the battlefield tapped — rule 608). `count: "all"` moves every match
       * with no decision; a number raises a `choose-from-zone` decision when
       * there are more matches than that, the rest staying in the graveyard. */
      readonly kind: "return-from-graveyard";
      readonly filter: CardFilter;
      readonly destination: "battlefield" | "hand";
      readonly count: number | "all";
      /** Battlefield-bound cards enter tapped (Splendid Reclamation). */
      readonly enterTapped?: boolean;
    }
  | {
      /** Target player discards `amount` cards (their choice, unless it's the
       * effect's own controller). Discards their whole hand if it's smaller.
       * `target: "you"` = the effect's controller, with no target slot
       * (Faithless Looting's "then discard two cards"). */
      readonly kind: "discard";
      readonly target: number | "you";
      readonly amount: EffectAmount;
    }
  | {
      readonly kind: "modify-pt";
      readonly target: EffectTargetRef;
      readonly power: EffectAmount;
      readonly toughness: EffectAmount;
      readonly duration: PtDuration;
    }
  | {
      /** Every battlefield permanent matching `filter` gets +power/+toughness
       * (Garruk Wildspeaker's ult / Overrun: `{ type: "creature",
       * controlledBy: "you" }`, `+3/+3`, `end-of-turn`; Craterhoof Behemoth:
       * `power`/`toughness` `{ countOf: … }` — a live count). */
      readonly kind: "modify-pt-all";
      readonly filter: CardFilter;
      readonly power: EffectAmount;
      readonly toughness: EffectAmount;
      readonly duration: PtDuration;
    }
  | {
      /** Every battlefield permanent matching `filter` gains `keyword` (Overrun:
       * trample until end of turn). */
      readonly kind: "grant-keyword-all";
      readonly filter: CardFilter;
      readonly keyword: Keyword;
      readonly duration: PtDuration;
    }
  | {
      readonly kind: "add-counter";
      readonly target: EffectTargetRef;
      readonly counter: string;
      readonly amount: number;
    }
  | {
      /** Proliferate (rule 701.27): every permanent that already has any
       * counter gets one more of each kind it has. This engine always
       * proliferates *everything* eligible rather than modeling the
       * "choose any number" clause. */
      readonly kind: "proliferate";
    }
  | {
      readonly kind: "grant-keyword";
      readonly target: EffectTargetRef;
      readonly keyword: Keyword;
      readonly duration: PtDuration;
    }
  | {
      /** `target` (an instant/sorcery card in a graveyard, via the
       * `"instant-or-sorcery-in-your-graveyard"` target spec) gains flashback
       * until end of turn for a cost equal to its mana cost — Snapcaster Mage
       * (ROADMAP Phase 6b). */
      readonly kind: "grant-flashback";
      readonly target: number;
    }
  | {
      /** The effect's controller takes an extra turn after this one (Time
       * Warp — rule 500.7 / ROADMAP Phase 7). */
      readonly kind: "take-extra-turn";
    }
  | {
      /** Storm (rule 702.40 — ROADMAP Phase 8): put a copy of the spell this
       * ability is on onto the stack for each other spell its controller cast
       * before it this turn. Copies keep the original's targets. */
      readonly kind: "storm";
    }
  | {
      /** Cascade (rule 702.85 — ROADMAP Phase 8): exile cards off the top of
       * the controller's library until a nonland card with lesser mana value
       * is exiled, then cast that card for free; the rest go to the bottom. */
      readonly kind: "cascade";
    }
  | {
      /** Copy target instant/sorcery spell on the stack (Twincast — rule
       * 707.10 / ROADMAP Phase 8). The copy keeps the original's targets. */
      readonly kind: "copy-spell";
      readonly target: number;
    }
  | {
      /** After this (post-combat) main phase there is an additional combat
       * phase then an additional main phase (Aggravated Assault — rule 500.8 /
       * ROADMAP Phase 7). */
      readonly kind: "additional-combat";
    }
  | {
      /** Untap every battlefield permanent matching `filter` (Aggravated
       * Assault: `{ type: "creature", controlledBy: "you" }`). */
      readonly kind: "untap-all";
      readonly filter: CardFilter;
    }
  | {
      /** `target` becomes a creature (rule 613 layer 4 for the added/set
       * types + subtypes, layer 5 for `setColors`, layer 6 for `keywords` /
       * `loseAbilities`, layer 7b for the set P/T). Printed types are kept —
       * a man-land is "still a land". `"source"` is the usual target
       * (man-lands animate themselves); Turn to Frog targets a creature. */
      readonly kind: "animate";
      readonly target: EffectTargetRef;
      readonly power: number;
      readonly toughness: number;
      readonly addTypes: readonly CardType[];
      readonly addSubtypes: readonly string[];
      /** Replace the printed subtypes entirely (Turn to Frog: "a … Frog"). */
      readonly setSubtypes?: readonly string[];
      /** Set the colours (Turn to Frog: "blue"). */
      readonly setColors?: readonly Color[];
      /** The permanent loses all of its own abilities (Turn to Frog). */
      readonly loseAbilities?: boolean;
      readonly keywords?: readonly Keyword[];
      readonly duration: PtDuration;
    }
  | {
      /** `target`'s text changes: one creature-type word is replaced by
       * another its controller chooses (Artificial Evolution — rule 612 /
       * layer 3). Resolving this raises a `choose-text` decision. */
      readonly kind: "change-text";
      readonly target: number;
    }
  | {
      readonly kind: "create-token";
      /** Name of a token definition in the {@link CardRegistry}. */
      readonly token: string;
      readonly count: EffectAmount;
      /** Who the tokens are created under the control of — the effect's
       * controller (default), or the controller of `targets[0]` (Beast Within:
       * "its controller creates a 3/3 Beast"; An Offer You Can't Refuse: the
       * countered spell's controller). Rule 111.11 — for a destroyed /
       * countered target this is its last-known controller. */
      readonly who?: "you" | "target-controller";
    }
  | {
      /** Create `count` token(s) that are copies of a permanent (rule 707.10 —
       * needed-cards P5b). `of` names what to copy: `"source"` (Scute Swarm —
       * the ability's own permanent), `"trigger-object"` (Miirym — the
       * permanent whose entering fired the trigger), or a target-slot index.
       * The tokens enter under the copied permanent's controller (rule 111.11 /
       * "its controller creates" — for a destroyed target its last-known
       * controller). */
      readonly kind: "create-token-copy";
      readonly of: "source" | "trigger-object" | number;
      readonly count: number;
      /** The token copies gain haste (Miirym). */
      readonly gainsHaste?: boolean;
      /** Exile the token copies at the beginning of the next end step (Miirym). */
      readonly exileAtEndStep?: boolean;
      /** The copies are not legendary (Miirym — "except it's not legendary"). */
      readonly notLegendary?: boolean;
      /** Override the copies' base power/toughness (Saw in Half — "except
       * they're each 1/1"; a layer-7b set, so counters / anthems still apply). */
      readonly basePt?: readonly [number, number];
    }
  | {
      /** Attach the source (an Aura/Equipment) to a target permanent. */
      readonly kind: "attach";
      readonly target: number;
    }
  | {
      /** Transform `target` — turn a transforming double-faced permanent over
       * to its other face (rule 701.28 / 712.10 — ROADMAP Phase 10b). No-op
       * for a permanent that isn't a transforming DFC. `"source"` transforms
       * the ability's own permanent (a werewolf, "sacrifice …: transform ~"). */
      readonly kind: "transform";
      readonly target: EffectTargetRef;
    }
  | {
      /** The game becomes day or night (rule 726 — ROADMAP Phase 10b). All
       * daybound/nightbound permanents transform to match. */
      readonly kind: "day-night";
      readonly value: "day" | "night";
    }
  | {
      /** A player becomes the monarch (rule 720 — ROADMAP Phase 10). `who`
       * defaults to the effect's controller. */
      readonly kind: "become-monarch";
      readonly who?: PlayerScope;
    }
  | {
      /** A player gets `amount` energy counters ({E} — rule 122 / ROADMAP
       * Phase 10). `who` defaults to the effect's controller. */
      readonly kind: "get-energy";
      readonly amount: number;
      readonly who?: PlayerScope;
    }
  | {
      /** The effect's controller gets an emblem (rule 114 — ROADMAP Phase 10).
       * `static` is a `"creatures-you-control"` anthem, folded in by the layer
       * system (the common planeswalker-ultimate emblem). */
      readonly kind: "create-emblem";
      readonly text: string;
      readonly static?: StaticAbility;
    }
  | {
      /** Prevent all combat damage that would be dealt this turn (Fog). A
       * rule-614 replacement, tracked as a turn-scoped `GameState` flag. */
      readonly kind: "prevent-all-combat-damage";
    }
  | {
      /** "Prevent the next `amount` damage that would be dealt to `target`
       * this turn" (Healing Salve — rule 614.9 / ROADMAP Phase 11 EG-6). A
       * one-shot prevention *shield* on `GameState.preventionShields`, consumed
       * in `dealDamage`. `combatOnly` narrows it to combat damage. */
      readonly kind: "prevent-damage";
      readonly target: number;
      readonly amount: EffectAmount;
      readonly combatOnly?: boolean;
    }
  | {
      /** A modal spell/ability (rule 700.2): as it resolves, its controller
       * chooses between `minModes` and `maxModes` of `modes` (usually 1 and 1
       * — "choose one"; 1 and 2 for "choose one or both") and the chosen
       * modes' effects apply in listed order. Raised as a `choose-modes`
       * decision. **Modes must be non-targeted** for now (targeted modal
       * spells need cast-time mode selection — see ROADMAP Phase 1c / 6).
       * Must be the whole effect or the last step of a `sequence`. */
      readonly kind: "modal";
      readonly minModes: number;
      readonly maxModes: number;
      readonly modes: readonly ModeOption[];
    }
  | {
      /** Apply `then` if `condition` holds at resolution, otherwise `else`
       * (rule 608.2 — an "if … then … otherwise …" clause). `condition` is
       * evaluated from the effect's source's controller's perspective, reusing
       * the static-ability {@link StaticCondition} union. needed-cards P5b —
       * Scute Swarm ("if you control six or more lands"). */
      readonly kind: "conditional";
      readonly condition: StaticCondition;
      readonly then: EffectSpec;
      readonly else?: EffectSpec;
    }
  | {
      /** "You may [effect]" (rule 601.3e / 608.2). Resolves via the same
       * `choose-modes` decision — one optional mode. Same non-targeted /
       * terminal restriction as `modal`. */
      readonly kind: "may";
      readonly effect: EffectSpec;
      /** The yes/no prompt, e.g. "Draw a card?". */
      readonly prompt: string;
    }
  | {
      /** Scry `amount` (rule 701.18) — look at the top N, put any number on
       * the bottom, keep the rest on top. `then` (Preordain: draw a card) is
       * applied after. */
      readonly kind: "scry";
      readonly amount: number;
      readonly then?: EffectSpec;
    }
  | {
      /** Surveil `amount` (rule 701.43) — look at the top N, put any number
       * into the graveyard, keep the rest on top. `then` applied after. */
      readonly kind: "surveil";
      readonly amount: number;
      readonly then?: EffectSpec;
    }
  | {
      /** Search the controller's library for up to `max` (at least `min`,
       * usually 0 — you may fail to find) cards matching `filter`, move them
       * to `destination`, then shuffle. Raised as a `choose-from-zone`
       * decision listing only the matching cards. */
      readonly kind: "search-library";
      readonly filter: CardFilter;
      readonly destination: "hand" | "battlefield";
      readonly min: number;
      readonly max: number;
      /** Put battlefield-bound cards in tapped (Rampant Growth). */
      readonly enterTapped?: boolean;
    }
  | {
      /** Reveal `count` cards from the top of the controller's library (or
       * their whole graveyard — already public, so `count` is ignored) and
       * await a bounded choice of which to move to `destination`. The spell
       * or ability itself still resolves and leaves the stack immediately,
       * same as any other effect — this just leaves the game waiting on the
       * controller's own `choose-from-zone` action before granting anyone
       * priority again. */
      readonly kind: "look-and-choose";
      readonly zone: "library" | "graveyard";
      readonly count?: number;
      readonly min: number;
      readonly max: number;
      readonly destination: "battlefield" | "hand";
      readonly leftover: "bottom-random" | "stay";
      /** Narrows which revealed candidates can be chosen (e.g. Ureni of the
       * Unwritten: only a Dragon card). Everything is still revealed either
       * way — omit for "any of them". */
      readonly filter?: ZoneChoiceFilter;
    };

/** One selectable mode of a `modal` effect (rule 700.2) or a `castModal` card
 * (ROADMAP Phase 11 EG-2). */
export interface ModeOption {
  /** Rules text of this mode, shown in the chooser. */
  readonly text: string;
  readonly effect: EffectSpec;
  /** Target specs this mode needs (ROADMAP Phase 11 EG-2 — `castModal` only).
   * The mode's `effect` reads them as slots `0..n-1` of the resolution
   * context's targets. Omitted / empty for a non-targeted mode. The
   * resolution-time `modal` / `may` effect requires *non*-targeted modes and
   * ignores this. */
  readonly targets?: readonly TargetSpec[];
}

/** Primitive mutations an effect can perform. Implemented by the engine. */
export interface EffectApi {
  dealDamage(target: TargetRef, amount: number): void;
  draw(player: PlayerId, count: number): void;
  gainLife(player: PlayerId, amount: number): void;
  loseLife(player: PlayerId, amount: number): void;
  /** Change life for a whole scope (`gain-life` / `lose-life` with `who`). */
  changeLifeScoped(who: PlayerScope, delta: number): void;
  addMana(player: PlayerId, mana: ManaType | "any-color", amount: number): void;
  tapPermanent(target: TargetRef): void;
  untapPermanent(target: TargetRef): void;
  destroyPermanent(target: TargetRef): void;
  /** Destroy every battlefield permanent matching `filter`. */
  destroyAll(filter: CardFilter): void;
  /** Deal `amount` damage to every battlefield permanent matching `filter`. */
  damageAll(filter: CardFilter, amount: number): void;
  /** Each of `who` (a scope, or `{ player }` for a targeted edict) sacrifices
   * `count` permanents matching `filter`. */
  sacrificePermanents(
    who: PlayerScope | { readonly player: PlayerId },
    filter: CardFilter,
    count: number,
    exceptId?: ObjectId,
  ): void;
  returnToHand(target: TargetRef): void;
  exileObject(target: TargetRef): void;
  /** Grant flashback to `target` (an instant/sorcery card in a graveyard) for
   * the rest of the turn, at a flashback cost equal to its mana cost
   * (Snapcaster Mage). */
  grantFlashback(target: TargetRef): void;
  /** `a` and `b` (both creatures) fight; with `oneSided` only `a` deals. */
  fight(a: TargetRef, b: TargetRef, oneSided: boolean): void;
  /** Counter a target spell on the stack. */
  counterSpell(target: TargetRef): void;
  /** The effect's controller gains control of `target`. */
  gainControl(target: TargetRef, untilEndOfTurn: boolean): void;
  /** `target` (a player) mills `amount` cards. */
  mill(target: TargetRef, amount: number): void;
  /** Number of battlefield permanents matching `filter`, evaluated with the
   * effect's controller as "you" (for an `EffectAmount` `{ countOf }`). */
  countMatching(filter: CardFilter): number;
  /** See the `"return-from-graveyard"` {@link EffectSpec} — from the effect's
   * controller's graveyard. */
  returnFromGraveyard(
    filter: CardFilter,
    destination: "battlefield" | "hand",
    count: number | "all",
    enterTapped: boolean,
  ): void;
  /** `target` (a player) discards `amount` cards. */
  discardCards(target: TargetRef, amount: number): void;
  modifyPt(
    target: TargetRef,
    power: number,
    toughness: number,
    duration: PtDuration,
  ): void;
  /** +power/+toughness to every battlefield permanent matching `filter`. */
  modifyPtAll(
    filter: CardFilter,
    power: number,
    toughness: number,
    duration: PtDuration,
  ): void;
  /** Grant `keyword` to every battlefield permanent matching `filter`. */
  grantKeywordAll(filter: CardFilter, keyword: Keyword, duration: PtDuration): void;
  addCounter(target: TargetRef, counter: string, amount: number): void;
  /** Proliferate — see the `"proliferate"` {@link EffectSpec}. */
  proliferate(): void;
  grantKeyword(target: TargetRef, keyword: Keyword, duration: PtDuration): void;
  /** The effect's controller takes an extra turn after this one (Time Warp). */
  takeExtraTurn(): void;
  /** Storm — copy the spell `sourceId` for each earlier spell its controller
   * cast this turn. */
  storm(sourceId: ObjectId): void;
  /** Cascade off `sourceId` (the cascade spell) for `controller`. */
  cascade(controller: PlayerId, sourceId: ObjectId): void;
  /** Copy the spell at `TargetRef` (an instant/sorcery on the stack). */
  copySpell(target: TargetRef): void;
  /** Queue an additional combat + main phase after this main phase (Aggravated
   * Assault). */
  additionalCombat(): void;
  /** Untap every battlefield permanent matching `filter`. */
  untapAll(filter: CardFilter): void;
  /** `target` becomes a creature — see the `"animate"` {@link EffectSpec}. */
  animate(
    target: TargetRef,
    opts: {
      readonly power: number;
      readonly toughness: number;
      readonly addTypes: readonly CardType[];
      readonly addSubtypes: readonly string[];
      readonly setSubtypes?: readonly string[];
      readonly setColors?: readonly Color[];
      readonly loseAbilities?: boolean;
      readonly keywords: readonly Keyword[];
      readonly duration: PtDuration;
    },
  ): void;
  /** Begin a text-changing effect — see the `"change-text"` {@link EffectSpec}. */
  changeText(target: TargetRef): void;
  /** Create `count` copies of the named token, controlled by `ctx.controller`. */
  createToken(
    token: string,
    count: number,
    who?: "you" | "target-controller",
  ): void;
  /** Create `count` token(s) that are copies of the permanent `of` — see the
   * `"create-token-copy"` {@link EffectSpec}. */
  createTokenCopy(
    of: ObjectId,
    count: number,
    opts: {
      gainsHaste: boolean;
      exileAtEndStep: boolean;
      notLegendary: boolean;
      basePt?: readonly [number, number];
    },
  ): void;
  /** True if `condition` holds from the effect source's controller's
   * perspective — see the `"conditional"` {@link EffectSpec}. */
  conditionMet(condition: StaticCondition): boolean;
  /** Attach `ctx.source` (an Aura/Equipment) to `target`. */
  attach(target: TargetRef): void;
  /** Transform `target` (a transforming DFC permanent) — see the `"transform"`
   * {@link EffectSpec}. */
  transform(target: TargetRef): void;
  /** The game becomes day or night (rule 726). */
  setDayNight(value: "day" | "night"): void;
  /** `who` becomes the monarch (rule 720). */
  becomeMonarch(who: PlayerScope | undefined): void;
  /** `who` gets `amount` energy counters (rule 122). */
  getEnergy(amount: number, who: PlayerScope | undefined): void;
  /** The effect's controller gets an emblem (rule 114). */
  createEmblem(text: string, staticAbility: StaticAbility | undefined): void;
  /** Prevent all combat damage this turn (Fog). */
  preventAllCombatDamage(): void;
  /** Add a one-shot damage-prevention shield on `target` (a player or object)
   * for `amount` damage this turn — Healing Salve (ROADMAP Phase 11 EG-6). */
  preventDamage(target: TargetRef, amount: number, combatOnly: boolean): void;
  /** Raise a `choose-modes` decision — see the `modal` / `may` {@link EffectSpec}.
   * The chosen modes' effects are applied after the controller answers. */
  chooseModes(
    minModes: number,
    maxModes: number,
    modes: readonly ModeOption[],
  ): void;
  /** Scry (`surveil: false`) or surveil (`surveil: true`) `amount` cards;
   * apply `then` afterwards. See the `"scry"` / `"surveil"` {@link EffectSpec}. */
  scry(amount: number, surveil: boolean, then: EffectSpec | undefined): void;
  /** See the `"search-library"` {@link EffectSpec}. */
  searchLibrary(
    filter: CardFilter,
    destination: "hand" | "battlefield",
    min: number,
    max: number,
    enterTapped: boolean,
  ): void;
  /** See the `"look-and-choose"` {@link EffectSpec}. */
  lookAndChoose(
    zone: "library" | "graveyard",
    count: number | undefined,
    min: number,
    max: number,
    destination: "battlefield" | "hand",
    leftover: "bottom-random" | "stay",
    filter: ZoneChoiceFilter | undefined,
  ): void;
}

export interface ResolutionContext extends EffectApi {
  readonly controller: PlayerId;
  readonly source: ObjectId;
  readonly targets: readonly TargetRef[];
  /** The value chosen for `{X}` when this spell/ability was put on the stack,
   * or 0 if its cost had no `{X}`. */
  readonly x: number;
  /** A numeric quantity supplied by the event that fired this triggered
   * ability (the triggering creature's power, or combat damage it dealt), or 0
   * outside a triggered-ability resolution. ROADMAP P4b. */
  readonly triggerValue: number;
  /** The object whose entering / attacking fired this triggered ability, or
   * `undefined` outside such a resolution — for `create-token-copy` with
   * `of: "trigger-object"` (Miirym). needed-cards P5b. */
  readonly triggerObject?: ObjectId;
  /** How many real, independent firings this resolution stands for — see
   * `GameObject.stackMultiplier`. `1` outside a scaled resolution. Only
   * `create-token` / `create-token-copy` read it (the only effect kinds
   * proven safe to multiply). Pure engine resource-safety optimization. */
  readonly stackMultiplier: number;
}

/** Effect kinds safe to fire once with their count/amount multiplied by a
 * stack's size instead of once per real, independent firing — no per-firing
 * choice or target, so N identical simultaneous firings are indistinguishable
 * from one firing scaled by N. Used only to decide whether a `stackCount`
 * object's ability (or a batch-entry event with `count > 1`) can take the
 * cheap path; anything else still fires once per real instance. Pure engine
 * resource-safety optimization (needed-cards P5b/P6 fuzz hardening) — not
 * derived from any rule, and never changes what a card actually does, only
 * how cheaply an exponential/large-batch case is computed. */
export function isCountScalableEffect(effect: EffectSpec): boolean {
  switch (effect.kind) {
    case "create-token":
      return effect.who !== "target-controller"; // that reads targets[0]
    case "create-token-copy":
      // "trigger-object" / a target slot each name a specific instance from
      // *this* firing — not safe to multiply as "N more of the same".
      return effect.of !== "trigger-object" && typeof effect.of !== "number";
    case "sequence":
      return effect.effects.every(isCountScalableEffect);
    case "conditional":
      return (
        isCountScalableEffect(effect.then) &&
        (effect.else === undefined || isCountScalableEffect(effect.else))
      );
    default:
      return false;
  }
}

/** Resolve an {@link EffectAmount} against the resolution context. */
export function amountValue(amount: EffectAmount, ctx: ResolutionContext): number {
  if (amount === "x") return ctx.x;
  if (typeof amount === "number") return amount;
  if ("triggerValue" in amount) return ctx.triggerValue;
  return ctx.countMatching(amount.countOf);
}

/** Imperative escape hatch for a spell or ability the vocab can't express. */
export type SpellResolver = (ctx: ResolutionContext) => void;

function resolveEffectTarget(
  ref: EffectTargetRef,
  ctx: ResolutionContext,
): TargetRef | undefined {
  if (ref === "source") return { kind: "object", object: ctx.source };
  return ctx.targets[ref];
}

export function applyEffectSpec(spec: EffectSpec, ctx: ResolutionContext): void {
  switch (spec.kind) {
    case "sequence": {
      for (const step of spec.effects) applyEffectSpec(step, ctx);
      return;
    }
    case "damage": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.dealDamage(target, amountValue(spec.amount, ctx));
      return;
    }
    case "add-mana":
      ctx.addMana(ctx.controller, spec.mana, spec.amount);
      if (spec.painToController !== undefined && spec.painToController > 0) {
        ctx.dealDamage(
          { kind: "player", player: ctx.controller },
          spec.painToController,
        );
      }
      return;
    case "draw":
      ctx.draw(ctx.controller, amountValue(spec.amount, ctx));
      return;
    case "gain-life":
      if (spec.who === undefined || spec.who === "you") ctx.gainLife(ctx.controller, spec.amount);
      else ctx.changeLifeScoped(spec.who, spec.amount);
      return;
    case "lose-life":
      if (spec.who === undefined || spec.who === "you") ctx.loseLife(ctx.controller, spec.amount);
      else ctx.changeLifeScoped(spec.who, -spec.amount);
      return;
    case "tap": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.tapPermanent(target);
      return;
    }
    case "untap": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.untapPermanent(target);
      return;
    }
    case "destroy": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.destroyPermanent(target);
      return;
    }
    case "destroy-all":
      ctx.destroyAll(spec.filter);
      return;
    case "damage-all":
      ctx.damageAll(spec.filter, amountValue(spec.amount, ctx));
      return;
    case "sacrifice": {
      const exceptId = spec.exceptSource ? ctx.source : undefined;
      if (spec.who === "target") {
        const target = ctx.targets[0];
        if (target?.kind === "player") {
          ctx.sacrificePermanents({ player: target.player }, spec.filter, spec.count, exceptId);
        }
      } else {
        ctx.sacrificePermanents(spec.who, spec.filter, spec.count, exceptId);
      }
      return;
    }
    case "fight": {
      const a = ctx.targets[spec.a];
      const b = ctx.targets[spec.b];
      if (a !== undefined && b !== undefined) ctx.fight(a, b, spec.oneSided === true);
      return;
    }
    case "counter": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.counterSpell(target);
      return;
    }
    case "gain-control": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.gainControl(target, spec.untilEndOfTurn);
      return;
    }
    case "return-to-hand": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.returnToHand(target);
      return;
    }
    case "exile": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.exileObject(target);
      return;
    }
    case "grant-flashback": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.grantFlashback(target);
      return;
    }
    case "mill": {
      const target =
        spec.target === "you"
          ? ({ kind: "player", player: ctx.controller } as const)
          : ctx.targets[spec.target];
      if (target !== undefined) ctx.mill(target, amountValue(spec.amount, ctx));
      return;
    }
    case "return-from-graveyard":
      ctx.returnFromGraveyard(
        spec.filter,
        spec.destination,
        spec.count,
        spec.enterTapped ?? false,
      );
      return;
    case "discard": {
      const target =
        spec.target === "you"
          ? ({ kind: "player", player: ctx.controller } as const)
          : ctx.targets[spec.target];
      if (target !== undefined) ctx.discardCards(target, amountValue(spec.amount, ctx));
      return;
    }
    case "modify-pt": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.modifyPt(
          target,
          amountValue(spec.power, ctx),
          amountValue(spec.toughness, ctx),
          spec.duration,
        );
      }
      return;
    }
    case "modify-pt-all":
      ctx.modifyPtAll(
        spec.filter,
        amountValue(spec.power, ctx),
        amountValue(spec.toughness, ctx),
        spec.duration,
      );
      return;
    case "grant-keyword-all":
      ctx.grantKeywordAll(spec.filter, spec.keyword, spec.duration);
      return;
    case "add-counter": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.addCounter(target, spec.counter, spec.amount);
      }
      return;
    }
    case "proliferate":
      ctx.proliferate();
      return;
    case "grant-keyword": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.grantKeyword(target, spec.keyword, spec.duration);
      }
      return;
    }
    case "take-extra-turn":
      ctx.takeExtraTurn();
      return;
    case "storm":
      ctx.storm(ctx.source);
      return;
    case "cascade":
      ctx.cascade(ctx.controller, ctx.source);
      return;
    case "copy-spell": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.copySpell(target);
      return;
    }
    case "additional-combat":
      ctx.additionalCombat();
      return;
    case "untap-all":
      ctx.untapAll(spec.filter);
      return;
    case "animate": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.animate(target, {
          power: spec.power,
          toughness: spec.toughness,
          addTypes: spec.addTypes,
          addSubtypes: spec.addSubtypes,
          setSubtypes: spec.setSubtypes,
          setColors: spec.setColors,
          loseAbilities: spec.loseAbilities,
          keywords: spec.keywords ?? [],
          duration: spec.duration,
        });
      }
      return;
    }
    case "change-text": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.changeText(target);
      return;
    }
    case "create-token":
      ctx.createToken(spec.token, amountValue(spec.count, ctx) * ctx.stackMultiplier, spec.who);
      return;
    case "create-token-copy": {
      let of: ObjectId | undefined;
      if (spec.of === "source") of = ctx.source;
      else if (spec.of === "trigger-object") of = ctx.triggerObject;
      else {
        const ref = ctx.targets[spec.of];
        of = ref?.kind === "object" ? ref.object : undefined;
      }
      if (of !== undefined) {
        ctx.createTokenCopy(of, spec.count * ctx.stackMultiplier, {
          gainsHaste: spec.gainsHaste ?? false,
          exileAtEndStep: spec.exileAtEndStep ?? false,
          notLegendary: spec.notLegendary ?? false,
          ...(spec.basePt ? { basePt: spec.basePt } : {}),
        });
      }
      return;
    }
    case "conditional": {
      const branch = ctx.conditionMet(spec.condition) ? spec.then : spec.else;
      if (branch !== undefined) applyEffectSpec(branch, ctx);
      return;
    }
    case "attach": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.attach(target);
      return;
    }
    case "transform": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.transform(target);
      return;
    }
    case "day-night":
      ctx.setDayNight(spec.value);
      return;
    case "become-monarch":
      ctx.becomeMonarch(spec.who);
      return;
    case "get-energy":
      ctx.getEnergy(spec.amount, spec.who);
      return;
    case "create-emblem":
      ctx.createEmblem(spec.text, spec.static);
      return;
    case "prevent-all-combat-damage":
      ctx.preventAllCombatDamage();
      return;
    case "prevent-damage": {
      const ref = ctx.targets[spec.target];
      if (ref !== undefined) {
        ctx.preventDamage(ref, amountValue(spec.amount, ctx), spec.combatOnly ?? false);
      }
      return;
    }
    case "modal":
      ctx.chooseModes(spec.minModes, spec.maxModes, spec.modes);
      return;
    case "may":
      ctx.chooseModes(0, 1, [{ text: spec.prompt, effect: spec.effect }]);
      return;
    case "scry":
      ctx.scry(spec.amount, false, spec.then);
      return;
    case "surveil":
      ctx.scry(spec.amount, true, spec.then);
      return;
    case "search-library":
      ctx.searchLibrary(
        spec.filter,
        spec.destination,
        spec.min,
        spec.max,
        spec.enterTapped === true,
      );
      return;
    case "look-and-choose":
      ctx.lookAndChoose(
        spec.zone,
        spec.count,
        spec.min,
        spec.max,
        spec.destination,
        spec.leftover,
        spec.filter,
      );
      return;
    default:
      throw new Error(
        `unhandled effect kind: ${(spec as { kind: string }).kind}`,
      );
  }
}

/**
 * The effect layer: a small declarative vocabulary that the engine interprets,
 * plus the `ResolutionContext` API that both declarative effects and imperative
 * `resolve` scripts (the escape hatch) call into.
 *
 * The engine ({@link Game}) supplies the concrete {@link EffectApi} implementation
 * — these functions just describe *what* to do. A `target` field is an index
 * into the spell's or ability's chosen targets, or the literal `"source"`.
 */

import type { TriggeredAbility } from "./abilities.js";
import type { CardType, Keyword, StaticAbility, StaticCondition } from "./cards.js";
import type { CardFilter } from "./filter.js";
import type { Color, ManaType } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { ResolvedTargets, TargetRef, TargetSpec } from "./target.js";

/** `"trigger-object"` reads `ResolutionContext.triggerObject` (needed-cards
 * P15 — Exalted's "that creature gets +1/+1", the lone attacker rather than
 * a target or the ability's own source). */
export type EffectTargetRef = number | "source" | "trigger-object";
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
  | { readonly triggerValue: true }
  /**
   * The mana value of whatever a target slot (or `"source"` /
   * `"trigger-object"`) points at — Feed the Swarm's "you lose life equal to
   * that permanent's mana value", Hoard-Smelter Dragon, Aura Mutation.
   *
   * Read off the object's printed card, so it still answers correctly after
   * the permanent has left the battlefield (rule 608.2h — last known
   * information). That matters because every card printed this way destroys
   * the permanent *first* and then reads its mana value. `0` for a player
   * target or an object that no longer exists at all.
   */
  | { readonly manaValueOf: EffectTargetRef }
  /** The effect controller's current life total (Ajani, Caller of the Pride's
   * ultimate: "create X 2/2 white Cat creature tokens, where X is your life
   * total"). */
  | { readonly lifeTotal: "you" }
  /** How many cards in **graveyards** match a filter — Undergrowth's "for
   * each creature card in your graveyard" (Lotleth Giant). Distinct from
   * `countOf`, which only ever counts battlefield permanents. The filter's
   * `ownedBy: "you"` is what restricts it to your own graveyard. */
  | { readonly countInGraveyard: CardFilter }
  /** The *current* power of whatever a target slot points at — Unleash Fury's
   * "double the power of target creature" is a `modify-pt` that adds this. */
  | { readonly powerOf: EffectTargetRef };

/** One way out of an `"unless"` clause. Exactly one field is set. */
export type UnlessOption =
  | { readonly pay: string; readonly text: string }
  | { readonly payLife: number; readonly text: string }
  | { readonly sacrifice: CardFilter; readonly text: string };

/** @deprecated Use {@link CardFilter} directly — kept as an alias so existing
 * `look-and-choose` / `matchesZoneChoiceFilter` call sites still type-check. */
export type ZoneChoiceFilter = CardFilter;

/** Which players an "each" / mass effect reaches. */
export type PlayerScope =
  | "each-player"
  | "each-opponent"
  | "you"
  /** Whoever's turn it is — "that player" in a trigger that fires on someone
   * else's step (Archfiend of Depravity). */
  | "active-player";

/** A declarative effect. Grows as milestones add vocabulary. */
export type EffectSpec =
  | {
      /** Apply several effects in order, sharing the same targets and X.
       * (e.g. Blightning: 3 damage to target player *and* that player
       * discards two cards.) */
      readonly kind: "sequence";
      readonly effects: readonly EffectSpec[];
    }
  | {
      readonly kind: "damage";
      readonly amount: EffectAmount;
      /** A target slot index — omit when `who` is set instead. */
      readonly target?: number;
      /** Untargeted damage to a whole scope of players (Sabotender / Tannuk:
       * "deals 1 damage to each opponent" — needed-cards P16), instead of a
       * chosen target. */
      readonly who?: PlayerScope;
    }
  | {
      /** `mana: "any-color"` — one mana of any of the five colours, the
       * player's choice (Arcane Signet, Command Tower, Treasure). During
       * cost payment the planner picks the colour it needs; a standalone
       * activation (holding priority, not paying anything) just adds white.
       * `mana: { oneOf: [...] }` — `amount` mana in any combination of the
       * listed colours, each unit independently chosen (Orcish Lumberjack:
       * "three mana in any combination of {R} and/or {G}" —
       * `{ oneOf: ["R", "G"] }`, `amount: 3`). During cost payment the planner
       * enumerates every achievable combination as a separate option and
       * picks whichever pays the cost; a standalone activation defaults to
       * `amount` of `oneOf[0]`, same simplification as "any-color" defaulting
       * to white. needed-cards P20. */
      readonly kind: "add-mana";
      /** `"chosen"` is the colour this permanent's controller named as it
       * entered (Heraldic Banner's "{T}: Add one mana of the chosen color") —
       * see `GameObject.chosenOnEnter`. */
      readonly mana:
        | ManaType
        | "any-color"
        | "chosen"
        | { readonly oneOf: readonly ManaType[] };
      readonly amount: number;
      /** Damage this mana ability deals to its controller when it's used (a
       * painland's coloured tap — Karplusan Forest: "{T}: Add {R} or {G}.
       * Karplusan Forest deals 1 damage to you."). The auto-payer prefers a
       * painless option and only reaches for this when it must. */
      readonly painToController?: number;
    }
  | {
      readonly kind: "draw";
      readonly amount: EffectAmount;
      /**
       * Who draws. Defaults to the effect's controller. `who` is a scope
       * (Stormfist Crusader: "each player draws a card"); `target` is a
       * target-slot index holding a player (Deep Analysis: "target player
       * draws two cards"). Mutually exclusive — `target` wins if both are set.
       */
      readonly who?: PlayerScope;
      readonly target?: number;
    }
  | {
      /**
       * "Each player discards their hand" (Dragon Mage, Runehorn Hellkite) —
       * a whole hand at once, with no choice to make, so it's distinct from
       * `discard`'s "choose N cards" and never raises a decision.
       */
      readonly kind: "discard-hand";
      readonly who: PlayerScope;
    }
  | {
      readonly kind: "gain-life";
      readonly amount: number;
      /** Who gains — the effect's controller (default), or a scope. */
      readonly who?: PlayerScope;
    }
  | {
      /** Life loss (Zulaport Cutthroat: "each opponent loses 1 life"). An
       * `EffectAmount` so it can scale — Feed the Swarm loses life equal to
       * the destroyed permanent's mana value. */
      readonly kind: "lose-life";
      readonly amount: EffectAmount;
      readonly who?: PlayerScope;
      /** A single *targeted* player instead of a scope (Ob Nixilis, the
       * Fallen: "target player loses 3 life") — a target-slot index holding
       * a player. Mutually exclusive with `who`. needed-cards P19. */
      readonly target?: number;
    }
  | { readonly kind: "tap"; readonly target: number }
  | {
      /** `target` accepts `"trigger-object"` for an untargeted "untap it"
       * off a trigger (Amulet of Vigor: untap the permanent that just
       * entered tapped). needed-cards P17. */
      readonly kind: "untap";
      readonly target: EffectTargetRef;
    }
  | { readonly kind: "destroy"; readonly target: number }
  | {
      /** Destroy every battlefield permanent matching `filter` (Wrath of God:
       * `{ type: "creature" }`). Indestructible / 903.9a handled per-permanent
       * downstream. */
      readonly kind: "destroy-all";
      readonly filter: CardFilter;
      /** Narrow to permanents whose *controller* was dealt combat damage by
       * this effect's source this turn — Steel Hellkite. Not a `CardFilter`
       * clause because it's a fact about the source, not about the permanent
       * being matched. */
      readonly onlyControllersDamagedBySource?: boolean;
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
      /** Every permanent matching `filter` deals `amount` damage to its own
       * controller (Rakdos Charm: "each creature deals 1 damage to its
       * controller") — the reverse direction from `damage-all` (which deals
       * damage FROM the effect's source TO matching permanents; here each
       * matching permanent is its own damage source, and the target is
       * always its controller, never the effect's caster). needed-cards P20. */
      readonly kind: "creatures-damage-controllers";
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
      /** Sacrifice the permanent this effect's own source is (Defense of the
       * Heart: "sacrifice ~. If you do, …"). No choice and no decision — rule
       * 701.17. `then` is the "if you do" tail: applied only when the
       * sacrifice actually happened, so a source that already left the
       * battlefield in response does nothing at all. needed-cards P7. */
      readonly kind: "sacrifice-source";
      readonly then?: EffectSpec;
    }
  | {
      /** `targets[a]` and `targets[b]` each deal damage equal to their power
       * to the other (rule 701.12). With `oneSided`, only `a` deals to `b`
       * (Rabid Bite). */
      readonly kind: "fight";
      /** `EffectTargetRef`s, so `"trigger-object"` works — Frontier Siege's
       * "you may have **it** fight target creature", where "it" is the
       * creature that just entered rather than a chosen target. */
      readonly a: EffectTargetRef;
      readonly b: EffectTargetRef;
      readonly oneSided?: boolean;
    }
  | {
      /** Return a target permanent to its owner's hand (rule 614-style
       * bounce). `target: "source"` bounces the effect's own permanent, with
       * no target at all (Encroaching Dragonstorm — needed-cards P16). */
      readonly kind: "return-to-hand";
      readonly target: EffectTargetRef;
    }
  | {
      /** Return every battlefield permanent matching `filter` to its owner's
       * hand (Cyclonic Rift, overloaded: "Return each nonland permanent you
       * don't control to its owner's hand"). Mirrors `destroy-all`. */
      readonly kind: "return-to-hand-all";
      readonly filter: CardFilter;
    }
  | {
      /** Put a target permanent into exile. */
      readonly kind: "exile";
      readonly target: number;
    }
  | {
      /**
       * Put a targeted card onto the battlefield — reanimation that names a
       * specific card, as opposed to `return-from-graveyard`'s filter over
       * your own graveyard. With `underYourControl` the card enters under the
       * *resolving* player's control even though its owner is someone else
       * (Gravespawn Sovereign: "put target creature card from a graveyard
       * onto the battlefield under your control").
       */
      readonly kind: "put-onto-battlefield";
      /** An `EffectTargetRef` so it can also name the object that fired the
       * trigger — Undying returns *itself*, which is never a chosen target. */
      readonly target: EffectTargetRef;
      readonly underYourControl?: boolean;
      readonly enterTapped?: boolean;
      /** Counters it enters with (Undying: "with a +1/+1 counter on it"). */
      readonly withCounters?: { readonly kind: string; readonly amount: number };
    }
  | {
      /** Exile every card in a target *player's* graveyard (rule 406 — Bojuka
       * Bog). `target` is a target-slot index holding a player, or `"you"` for
       * the effect's own controller with no slot. needed-cards P8. */
      readonly kind: "exile-graveyard";
      readonly target: number | "you";
    }
  | {
      /** Exile a target permanent, then immediately return it to the
       * battlefield under its owner's control (rule 400.7 — a "blink": the
       * returning permanent is a brand-new object with no memory of the old
       * one, so counters, Auras/Equipment, tapped status, and effects like
       * stolen control all fall off). A token exiled this way ceases to exist
       * and never returns (rule 111.7 / 704.5d). needed-cards P9 — Essence Flux. */
      readonly kind: "flicker";
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
      /** Double each matching permanent's *current* power and toughness
       * (Unnatural Growth: "double the power and toughness of each creature
       * you control until end of turn"). Reads each one's own computed P/T
       * individually and adds that much again, unlike `modify-pt-all`'s
       * single shared amount — a 2/2 and a 5/5 both matching become a 4/4
       * and a 10/10, not identical stat lines. */
      readonly kind: "double-pt-all";
      readonly filter: CardFilter;
      readonly duration: PtDuration;
    }
  | {
      /** Double the number of a specific counter kind on each matching
       * permanent (Kalonian Hydra / Bristly Bill: "double the number of
       * +1/+1 counters on each creature you control") — adds a counter count
       * equal to what's already there. Routes through the same `addCounter`
       * a targeted `add-counter` effect uses, so Doubling Season's
       * replacement still folds in on top (rule ruling: doubling an existing
       * count via an effect and Doubling Season compose to 3x, not 4x). A
       * permanent with none of `counterKind` is untouched. */
      readonly kind: "double-counters-all";
      readonly filter: CardFilter;
      readonly counterKind: string;
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
      /** A fixed amount, `"x"`, or a live count (Will of the Sultai: "X
       * +1/+1 counters, where X is the number of lands you control" —
       * needed-cards P16). */
      readonly amount: EffectAmount;
    }
  | {
      /**
       * Put counters on **every** battlefield permanent matching `filter`
       * (Loyal Guardian: "put a +1/+1 counter on each creature you control").
       * The untargeted, mass form of `add-counter`; routes through the same
       * per-permanent path, so a `would-add-counter` replacement (Doubling
       * Season) still composes.
       */
      readonly kind: "add-counter-all";
      readonly filter: CardFilter;
      readonly counter: string;
      readonly amount: EffectAmount;
    }
  | {
      /** "You gain hexproof until end of turn" (Lazotep Plating). A *player*
       * can't be targeted by opponents' spells or abilities; permanents
       * gaining hexproof is `grant-keyword-all` instead. */
      readonly kind: "grant-player-hexproof";
      readonly who?: PlayerScope;
    }
  | {
      /**
       * Populate (rule 701.32) — create a token that's a copy of a creature
       * token you control (Rootborn Defenses).
       *
       * The rules let the controller pick which creature token to copy; this
       * copies the largest by power. With zero or one creature token — which
       * is every case the precons produce — the choice is forced anyway. See
       * AUTHORING §15 "Partial".
       */
      readonly kind: "populate";
    }
  | {
      /**
       * Amass N (rule 701.44) — "Amass Zombies 2": put N +1/+1 counters on an
       * Army you control; it's also a `creatureType`. If you control no Army,
       * create a 0/0 black Army creature token first.
       *
       * One effect rather than a `conditional` + `create-token` +
       * `add-counter` sequence, because "an Army you control" has to be the
       * *same* Army across the create and the counters — the whole point of
       * the mechanic is that repeated amassing grows one creature.
       */
      readonly kind: "amass";
      readonly amount: EffectAmount;
      /** The creature type amass names; the Army gains it (701.44b). */
      readonly creatureType: string;
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
      /**
       * Give a permanent a triggered ability — "gains 'Whenever this creature
       * deals combat damage to a player, draw that many cards'" (Hunter's
       * Prowess, Hunter's Insight).
       *
       * The one-shot counterpart of `StaticAbility.grantsTriggered`: it rides
       * on the target's own modifiers, so an `"end-of-turn"` grant expires
       * with every other until-end-of-turn modifier.
       */
      readonly kind: "grant-triggered";
      readonly target: EffectTargetRef;
      readonly ability: TriggeredAbility;
      readonly duration: PtDuration;
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
      /** Who the token enters under. Default is the *copied* permanent's own
       * controller (Miirym copying your own Dragons); `"you"` puts it under
       * the effect's controller instead, which is what a card that copies
       * something an opponent controls means (Hate Mirage). */
      readonly who?: "you";
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
      /**
       * An optional *cost* to say yes — "you may pay {B}. If you do, draw a
       * card" (Nihil Spellbomb, Dawn of Hope, Mentor of the Meek).
       *
       * The choice is only offered when the player could actually pay, so
       * declining for lack of mana and declining by choice both land on
       * `else`. Paid as the choice is answered, not when the effect resolves.
       */
      readonly cost?: string;
      /** "If you do, [effect]" (rule 608.2h) — applied only when `effect` was
       * actually chosen (Ob Nixilis, the Fallen: "you may have target player
       * lose 3 life. If you do, put three +1/+1 counters on Ob Nixilis.").
       * needed-cards P19. */
      readonly then?: EffectSpec;
      /** "If you don't, [effect]" — applied only when `effect` was declined
       * (Springheart Nantuko: "…if you do, create a token copy… If you
       * didn't create a token this way, create a 1/1 Insect instead."; The
       * Gitrog Monster's "sacrifice ~ unless you sacrifice a land" is the
       * same shape with `effect` framed as the *unless* clause). needed-cards
       * P19. */
      readonly else?: EffectSpec;
    }
  | {
      /**
       * A "punisher" clause — *someone else* chooses whether to pay, and the
       * effect only happens if they don't. "…deals 5 damage to target
       * opponent **unless that player sacrifices a creature of their
       * choice**" (Demanding Dragon), "…**unless that creature's controller
       * pays {3}**" (Kazuul), "draw a card **unless target opponent
       * sacrifices a creature or pays 3 life**" (Indulgent Tormentor).
       *
       * The decision belongs to `chooser`, not to the effect's controller —
       * which is what makes this its own shape rather than a `may`. Options
       * the chooser can't take aren't offered, so "couldn't" and "wouldn't"
       * both land on `otherwise`.
       */
      readonly kind: "unless";
      /** Who decides: a target-slot index holding a player, or the controller
       * of the permanent whose event fired this trigger (Kazuul's attacker). */
      readonly chooser: number | "trigger-controller";
      /** What they may do to avoid `otherwise`. At most one mana option, since
       * the mana cost rides on the decision itself. */
      readonly options: readonly UnlessOption[];
      /** What happens if they take none of the options. */
      readonly otherwise: EffectSpec;
    }
  | {
      /**
       * "That player chooses up to `keep` creatures they control, then
       * sacrifices the rest" (Archfiend of Depravity) — the inverse of
       * `sacrifice`, which names how many to *give up* rather than how many
       * to keep.
       *
       * The choice belongs to each affected player, and is raised only when
       * they control more than `keep` matching permanents.
       */
      readonly kind: "sacrifice-all-but";
      readonly who: PlayerScope;
      readonly keep: number;
      readonly filter: CardFilter;
    }
  | {
      /**
       * Encore (rule 702.140) — "For each opponent, create a token copy of
       * this card that attacks that opponent this turn if able. They gain
       * haste. Sacrifice them at the beginning of the next end step."
       *
       * One effect because the per-opponent loop, the attack requirement
       * aimed at *that* opponent, and the end-step sacrifice are one
       * instruction — and the copies are of a card in exile (the Encore cost
       * exiled it), which nothing else does.
       */
      readonly kind: "encore";
    }
  | {
      /**
       * Goad every creature a target player controls (rule 701.38 — Geode
       * Rager). Until the goader's next turn those creatures attack each
       * combat if able, and attack someone other than the goader if able.
       */
      readonly kind: "goad";
      /** A target-slot index holding the player whose creatures are goaded. */
      readonly target: number;
    }
  | {
      /**
       * "Impulse draw" — exile the top `amount` cards of your library face-up
       * and let yourself play them (Dream Pillager, Tectonic Giant, Theater
       * of Horrors).
       *
       * `duration: "end-of-turn"` is the common shape; `"while-source"` keeps
       * the permission for as long as the permanent that exiled them is on
       * the battlefield. `castOnly` is "you may **cast spells** from among
       * them" (no lands) rather than "you may **play** them".
       */
      readonly kind: "impulse-exile";
      readonly amount: EffectAmount;
      readonly duration: "end-of-turn" | "your-next-turn" | "while-source";
      readonly castOnly?: boolean;
      /** Grant the permission to only this many of the exiled cards, chosen
       * by the controller — Tectonic Giant's "exile the top two cards of your
       * library. **Choose one of them.**" The rest stay exiled with no
       * permission. Omit to grant it to all of them. */
      readonly choose?: number;
      /** Gates on *using* the permission (Theater of Horrors), as opposed to
       * `duration`, which is when it lapses for good. */
      readonly yourTurnOnly?: boolean;
      readonly gate?: StaticCondition;
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
      /** An `EffectAmount` so a tutor can find "up to X" where X is a live
       * count — Harvest Season's "up to X basic land cards, where X is the
       * number of tapped creatures you control". */
      readonly max: EffectAmount;
      /** Put battlefield-bound cards in tapped (Rampant Growth). */
      readonly enterTapped?: boolean;
      /** Where chosen cards after the first go, for a tutor that splits its
       * finds (Cultivate: "put one onto the battlefield tapped and the other
       * into your hand"). Omit when every find goes to `destination`. */
      readonly restDestination?: "hand" | "battlefield";
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
      /** `"hand"` (needed-cards P19 — Genesis Ultimatum: "…and the rest into
       * your hand") puts every non-chosen looked-at card into the chooser's
       * hand, regardless of `filter`. */
      readonly leftover: "bottom-random" | "stay" | "hand";
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
  /** Deal damage to a whole scope of players, untargeted (Sabotender /
   * Tannuk: "deals 1 damage to each opponent" — needed-cards P16). */
  dealDamageScoped(who: PlayerScope, amount: number): void;
  draw(player: PlayerId, count: number): void;
  /** The mana value of the card behind `target`, from its printed cost — see
   * the `{ manaValueOf }` {@link EffectAmount}. `0` for a player target or an
   * object that no longer exists. */
  manaValueOf(target: TargetRef): number;
  /** A player's current life total — see the `{ lifeTotal }` {@link EffectAmount}. */
  lifeTotalOf(player: PlayerId): number;
  /** See the `{ countInGraveyard }` {@link EffectAmount}. */
  countInGraveyard(filter: CardFilter): number;
  /** See the `{ powerOf }` {@link EffectAmount}. */
  powerOf(target: TargetRef): number;
  /** Every player a `PlayerScope` names, in APNAP order and skipping anyone
   * who has already lost. The shared scope resolution behind `draw`'s `who`,
   * `discard-hand`, and anything else that acts on a scope one player at a
   * time rather than in one call. */
  playersInScope(who: PlayerScope): readonly PlayerId[];
  /** Discard a player's whole hand at once (rule 701.8) — no choice, so this
   * never raises a `discard` decision the way `discardCards` does. */
  discardHand(player: PlayerId): void;
  gainLife(player: PlayerId, amount: number): void;
  loseLife(player: PlayerId, amount: number): void;
  /** Change life for a whole scope (`gain-life` / `lose-life` with `who`). */
  changeLifeScoped(who: PlayerScope, delta: number): void;
  addMana(
    player: PlayerId,
    mana: ManaType | "any-color" | { readonly oneOf: readonly ManaType[] },
    amount: number,
  ): void;
  tapPermanent(target: TargetRef): void;
  untapPermanent(target: TargetRef): void;
  destroyPermanent(target: TargetRef): void;
  /** Destroy every battlefield permanent matching `filter`. With
   * `onlyControllersDamagedBySource`, restricted to those whose controller
   * this effect's source dealt combat damage to this turn. */
  destroyAll(filter: CardFilter, onlyControllersDamagedBySource?: boolean): void;
  /** Return every battlefield permanent matching `filter` to its owner's hand. */
  returnToHandAll(filter: CardFilter): void;
  /** Deal `amount` damage to every battlefield permanent matching `filter`. */
  damageAll(filter: CardFilter, amount: number): void;
  /** Every battlefield permanent matching `filter` deals `amount` damage to
   * its own controller — see the `"creatures-damage-controllers"`
   * {@link EffectSpec}. */
  creaturesDamageControllers(filter: CardFilter, amount: number): void;
  /** Each of `who` (a scope, or `{ player }` for a targeted edict) sacrifices
   * `count` permanents matching `filter`. */
  sacrificePermanents(
    who: PlayerScope | { readonly player: PlayerId },
    filter: CardFilter,
    count: number,
    exceptId?: ObjectId,
  ): void;
  /** Sacrifice this effect's own source. Returns whether it actually happened
   * (false if the source has already left the battlefield) — the "if you do"
   * gate on a `sacrifice-source` effect's `then`. */
  sacrificeSource(): boolean;
  returnToHand(target: TargetRef): void;
  exileObject(target: TargetRef): void;
  /** Exile every card in `target`'s graveyard (a player — Bojuka Bog). */
  exileGraveyard(target: TargetRef): void;
  /** Exile `target`, then immediately return it to the battlefield under its
   * owner's control — see the `"flicker"` {@link EffectSpec}. */
  flicker(target: TargetRef): void;
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
  /** See the `"double-pt-all"` {@link EffectSpec}. */
  doublePtAll(filter: CardFilter, duration: PtDuration): void;
  /** See the `"grant-player-hexproof"` {@link EffectSpec}. */
  grantPlayerHexproof(who: PlayerScope): void;
  /** See the `"sacrifice-all-but"` {@link EffectSpec}. */
  sacrificeAllBut(player: PlayerId, keep: number, filter: CardFilter): void;
  /** See the `"encore"` {@link EffectSpec}. */
  encore(): void;
  /** The colour this effect's source named as it entered, or `undefined` —
   * see `GameObject.chosenOnEnter` and `add-mana`'s `"chosen"`. */
  chosenColorOfSource(): ManaType | undefined;
  /** See the `"goad"` {@link EffectSpec}. */
  goadCreaturesOf(player: PlayerId): void;
  /** See the `"impulse-exile"` {@link EffectSpec}. */
  impulseExile(
    amount: number,
    duration: "end-of-turn" | "your-next-turn" | "while-source",
    castOnly: boolean,
    opts?: {
      readonly choose?: number;
      readonly yourTurnOnly?: boolean;
      readonly gate?: StaticCondition;
    },
  ): void;
  /** See the `"unless"` {@link EffectSpec}. */
  unless(
    chooser: number | "trigger-controller",
    options: readonly UnlessOption[],
    otherwise: EffectSpec,
  ): void;
  /** See the `"populate"` {@link EffectSpec}. */
  populate(): void;
  /** See the `"amass"` {@link EffectSpec}. */
  amass(amount: number, creatureType: string): void;
  /** See the `"add-counter-all"` {@link EffectSpec}. */
  addCounterAll(filter: CardFilter, counter: string, amount: number): void;
  /** See the `"double-counters-all"` {@link EffectSpec}. */
  doubleCountersAll(filter: CardFilter, counterKind: string): void;
  addCounter(target: TargetRef, counter: string, amount: number): void;
  /** Proliferate — see the `"proliferate"` {@link EffectSpec}. */
  proliferate(): void;
  grantKeyword(target: TargetRef, keyword: Keyword, duration: PtDuration): void;
  /** See the `"grant-triggered"` {@link EffectSpec}. */
  grantTriggered(
    target: TargetRef,
    ability: TriggeredAbility,
    duration: PtDuration,
  ): void;
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
      /** Controller for the new token; defaults to the copied permanent's. */
      readonly under?: PlayerId;
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
   * The chosen modes' effects are applied after the controller answers.
   * `onDecline` (a `may` effect's `else` only) applies when zero modes end up
   * chosen. */
  chooseModes(
    minModes: number,
    maxModes: number,
    modes: readonly ModeOption[],
    onDecline?: EffectSpec,
    /** A mana cost the chooser must pay to pick a mode — see `may.cost`. */
    cost?: string,
  ): void;
  /** Scry (`surveil: false`) or surveil (`surveil: true`) `amount` cards;
   * apply `then` afterwards. See the `"scry"` / `"surveil"` {@link EffectSpec}. */
  scry(amount: number, surveil: boolean, then: EffectSpec | undefined): void;
  /** See the `"put-onto-battlefield"` {@link EffectSpec}. */
  putOntoBattlefield(
    target: TargetRef,
    underYourControl: boolean,
    enterTapped: boolean,
    withCounters?: { readonly kind: string; readonly amount: number },
  ): void;
  /** See the `"search-library"` {@link EffectSpec}. */
  searchLibrary(
    filter: CardFilter,
    destination: "hand" | "battlefield",
    min: number,
    max: number,
    enterTapped: boolean,
    restDestination?: "hand" | "battlefield",
  ): void;
  /** See the `"look-and-choose"` {@link EffectSpec}. */
  lookAndChoose(
    zone: "library" | "graveyard",
    count: number | undefined,
    min: number,
    max: number,
    destination: "battlefield" | "hand",
    leftover: "bottom-random" | "stay" | "hand",
    filter: ZoneChoiceFilter | undefined,
  ): void;
}

export interface ResolutionContext extends EffectApi {
  readonly controller: PlayerId;
  readonly source: ObjectId;
  /** One entry per declared slot; a hole marks an **optional** slot the
   * player left empty (see `ResolvedTargets`). Reading `ctx.targets[i]` and
   * checking for `undefined` — which effects already do for an out-of-range
   * index — is all a skipped slot needs. */
  readonly targets: ResolvedTargets;
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
  if ("lifeTotal" in amount) return ctx.lifeTotalOf(ctx.controller);
  if ("countInGraveyard" in amount) return ctx.countInGraveyard(amount.countInGraveyard);
  if ("powerOf" in amount) {
    const ref = resolveEffectTarget(amount.powerOf, ctx);
    return ref === undefined ? 0 : ctx.powerOf(ref);
  }
  if ("manaValueOf" in amount) {
    const ref = resolveEffectTarget(amount.manaValueOf, ctx);
    return ref === undefined ? 0 : ctx.manaValueOf(ref);
  }
  return ctx.countMatching(amount.countOf);
}

/** Imperative escape hatch for a spell or ability the vocab can't express. */
export type SpellResolver = (ctx: ResolutionContext) => void;

function resolveEffectTarget(
  ref: EffectTargetRef,
  ctx: ResolutionContext,
): TargetRef | undefined {
  if (ref === "source") return { kind: "object", object: ctx.source };
  if (ref === "trigger-object") {
    return ctx.triggerObject !== undefined
      ? { kind: "object", object: ctx.triggerObject }
      : undefined;
  }
  return ctx.targets[ref];
}

export function applyEffectSpec(spec: EffectSpec, ctx: ResolutionContext): void {
  switch (spec.kind) {
    case "sequence": {
      for (const step of spec.effects) applyEffectSpec(step, ctx);
      return;
    }
    case "damage": {
      if (spec.who !== undefined) {
        ctx.dealDamageScoped(spec.who, amountValue(spec.amount, ctx));
        return;
      }
      const target = spec.target !== undefined ? ctx.targets[spec.target] : undefined;
      if (target !== undefined) ctx.dealDamage(target, amountValue(spec.amount, ctx));
      return;
    }
    case "add-mana":
      ctx.addMana(
        ctx.controller,
        // "The chosen color" — resolved against the source permanent; falls
        // back to the payer's choice if the label isn't a colour (it always
        // is on the cards that use this).
        spec.mana === "chosen" ? (ctx.chosenColorOfSource() ?? "any-color") : spec.mana,
        spec.amount,
      );
      if (spec.painToController !== undefined && spec.painToController > 0) {
        ctx.dealDamage(
          { kind: "player", player: ctx.controller },
          spec.painToController,
        );
      }
      return;
    case "draw": {
      const amount = amountValue(spec.amount, ctx);
      if (spec.target !== undefined) {
        const ref = ctx.targets[spec.target];
        if (ref?.kind === "player") ctx.draw(ref.player, amount);
        return;
      }
      for (const player of ctx.playersInScope(spec.who ?? "you")) {
        ctx.draw(player, amount);
      }
      return;
    }
    case "discard-hand":
      for (const player of ctx.playersInScope(spec.who)) ctx.discardHand(player);
      return;
    case "gain-life":
      if (spec.who === undefined || spec.who === "you") ctx.gainLife(ctx.controller, spec.amount);
      else ctx.changeLifeScoped(spec.who, spec.amount);
      return;
    case "lose-life": {
      const life = amountValue(spec.amount, ctx);
      if (spec.target !== undefined) {
        const ref = ctx.targets[spec.target];
        if (ref?.kind === "player") ctx.loseLife(ref.player, life);
        return;
      }
      if (spec.who === undefined || spec.who === "you") ctx.loseLife(ctx.controller, life);
      else ctx.changeLifeScoped(spec.who, -life);
      return;
    }
    case "tap": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.tapPermanent(target);
      return;
    }
    case "untap": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.untapPermanent(target);
      return;
    }
    case "destroy": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.destroyPermanent(target);
      return;
    }
    case "destroy-all":
      ctx.destroyAll(spec.filter, spec.onlyControllersDamagedBySource);
      return;
    case "return-to-hand-all":
      ctx.returnToHandAll(spec.filter);
      return;
    case "damage-all":
      ctx.damageAll(spec.filter, amountValue(spec.amount, ctx));
      return;
    case "creatures-damage-controllers":
      ctx.creaturesDamageControllers(spec.filter, amountValue(spec.amount, ctx));
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
    case "sacrifice-source": {
      // "Sacrifice ~. If you do, …" — the tail only applies when the sacrifice
      // actually happened (rule 603.4-adjacent: the source may have been
      // removed in response).
      const sacrificed = ctx.sacrificeSource();
      if (sacrificed && spec.then !== undefined) applyEffectSpec(spec.then, ctx);
      return;
    }
    case "fight": {
      const a = resolveEffectTarget(spec.a, ctx);
      const b = resolveEffectTarget(spec.b, ctx);
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
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.returnToHand(target);
      return;
    }
    case "exile": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.exileObject(target);
      return;
    }
    case "put-onto-battlefield": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.putOntoBattlefield(
          target,
          spec.underYourControl === true,
          spec.enterTapped === true,
          spec.withCounters,
        );
      }
      return;
    }
    case "exile-graveyard": {
      const target =
        spec.target === "you"
          ? ({ kind: "player", player: ctx.controller } as const)
          : ctx.targets[spec.target];
      if (target !== undefined) ctx.exileGraveyard(target);
      return;
    }
    case "flicker": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.flicker(target);
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
    case "double-pt-all":
      ctx.doublePtAll(spec.filter, spec.duration);
      return;
    case "grant-player-hexproof":
      ctx.grantPlayerHexproof(spec.who ?? "you");
      return;
    case "populate":
      ctx.populate();
      return;
    case "amass":
      ctx.amass(amountValue(spec.amount, ctx), spec.creatureType);
      return;
    case "add-counter-all":
      ctx.addCounterAll(spec.filter, spec.counter, amountValue(spec.amount, ctx));
      return;
    case "double-counters-all":
      ctx.doubleCountersAll(spec.filter, spec.counterKind);
      return;
    case "grant-keyword-all":
      ctx.grantKeywordAll(spec.filter, spec.keyword, spec.duration);
      return;
    case "add-counter": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.addCounter(target, spec.counter, amountValue(spec.amount, ctx));
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
    case "grant-triggered": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.grantTriggered(target, spec.ability, spec.duration);
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
          under: spec.who === "you" ? ctx.controller : undefined,
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
    case "may": {
      const chosenEffect: EffectSpec =
        spec.then === undefined
          ? spec.effect
          : { kind: "sequence", effects: [spec.effect, spec.then] };
      ctx.chooseModes(
        0,
        1,
        [{ text: spec.prompt, effect: chosenEffect }],
        spec.else,
        spec.cost,
      );
      return;
    }
    case "sacrifice-all-but":
      for (const player of ctx.playersInScope(spec.who)) {
        ctx.sacrificeAllBut(player, spec.keep, spec.filter);
      }
      return;
    case "encore":
      ctx.encore();
      return;
    case "goad": {
      const ref = ctx.targets[spec.target];
      if (ref?.kind === "player") ctx.goadCreaturesOf(ref.player);
      return;
    }
    case "impulse-exile":
      ctx.impulseExile(amountValue(spec.amount, ctx), spec.duration, spec.castOnly === true, {
        choose: spec.choose,
        yourTurnOnly: spec.yourTurnOnly,
        gate: spec.gate,
      });
      return;
    case "unless":
      ctx.unless(spec.chooser, spec.options, spec.otherwise);
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
        amountValue(spec.max, ctx),
        spec.enterTapped === true,
        spec.restDestination,
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

/**
 * Abilities printed on a permanent.
 *
 * - Activated: `[cost]: [effect]`. A *mana ability* ({@link isManaAbility})
 *   produces mana, targets nothing, and resolves immediately without the stack.
 * - Triggered: "when/whenever/at ...". Detected after game events and put on the
 *   stack the next time a player would receive priority (rule 603).
 *
 * Costs and effects reuse the spell vocabulary.
 */

import type { StaticCondition } from "./cards/define.js";
import type { EffectSpec, SpellResolver } from "./effects.js";
import type { GameEvent } from "./events.js";
import type { CardFilter } from "./filter.js";
import type { TargetSpec } from "./target.js";
import type { Step } from "./turn.js";

/** A non-mana, non-tap component of an ability cost that sacrifices a permanent. */
export type SacrificeCost =
  /** Sacrifice the permanent whose ability this is. */
  | "self"
  /** Sacrifice a creature the activating player controls (their choice; may be
   * the source itself). */
  | "creature-you-control"
  /** Sacrifice a permanent the activating player controls matching `filter`
   * (their choice — Zuran Orb "Sacrifice a land", Orcish Lumberjack "Sacrifice
   * a Forest"). needed-cards P6. */
  | { readonly filter: CardFilter };

export interface AbilityCost {
  /** Mana portion of the cost, e.g. `"{2}"`; `null` for no mana. */
  readonly mana: string | null;
  /** Whether `{T}` (tap this permanent) is part of the cost. */
  readonly tap: boolean;
  /** A sacrifice that is part of the cost, or `undefined` for none. */
  readonly sacrifice?: SacrificeCost;
  /** Life to pay as part of the cost (Greed: "Pay 2 life"). Rule 118.4 — a
   * player can't pay more life than they have. */
  readonly payLife?: number;
  /** Counters to remove from the source as part of the cost (Walking
   * Ballista: "Remove a +1/+1 counter from ~"). */
  readonly removeCounter?: { readonly kind: string; readonly count: number };
  /** Energy counters to pay ({E} — rule 122 / ROADMAP Phase 10; automatic,
   * like `payLife`). */
  readonly payEnergy?: number;
  /** Exile the source itself as part of the cost (Hanged Executioner:
   * "{3}{W}, Exile this creature: Exile target creature"). Distinct from
   * `sacrifice: "self"` — the source doesn't reach a graveyard, so nothing
   * that watches for a death sees one. */
  readonly exileSelf?: boolean;
  /** Discard your whole hand as part of the cost (Slate of Ancestry: "{4},
   * {T}, Discard your hand: Draw a card for each creature you control").
   * Nothing to choose, so it's automatic like `payLife` — the empty hand is
   * a legal payment, which is why this never gates activation. */
  readonly discardHand?: boolean;
  /**
   * Tap *other* permanents you control as part of the cost — Gravespawn
   * Sovereign's "Tap five untapped Zombies you control". Distinct from
   * `tap`, which taps the source itself.
   *
   * The engine taps the first eligible ones rather than asking. The rules
   * give the controller the choice; it only matters when the candidates
   * differ in some other way (one has its own tap ability), and no card in
   * the pool creates that situation — recorded in AUTHORING §15 alongside
   * `populate`'s similar compromise.
   */
  readonly tapOthers?: {
    readonly count: number;
    readonly filter: CardFilter;
    /** Whether the ability's own source may be one of the permanents tapped.
     * True for Gravespawn Sovereign, which is itself a Zombie and has no
     * `{T}` of its own to conflict with. */
    readonly includeSelf?: boolean;
  };
}

export interface ActivatedAbility {
  readonly cost: AbilityCost;
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
  readonly text: string;
  /** True for abilities like Equip that function only as a sorcery (rule 602.3). */
  readonly sorcerySpeed?: boolean;
  /**
   * A loyalty ability (rule 606) — present ⇒ this ability's cost is "add
   * `loyaltyCost` loyalty counters to the source" (negative removes them),
   * it functions only as a sorcery, and only one loyalty ability of a given
   * permanent may be activated each turn. `cost.mana` / `cost.tap` are
   * ignored; a loyalty ability with a target is fine ("+1: Untap two target
   * lands"). Uses the stack like any other activated ability.
   */
  readonly loyaltyCost?: number;
  /** "…another target X" (Manifold Key: "Untap another target artifact") —
   * the source permanent itself is excluded from every target slot's legal
   * options. Without it a self-untap-style ability can target itself and
   * become a repeatable no-net-cost loop the fuzzer's tick budget catches;
   * mirrors `TriggerSpec.otherOnly`. needed-cards P17.
   *
   * It also keeps the source out of its own **sacrifice cost** (Ayara, First
   * of Locthwain: "Sacrifice **another** black creature") — same word, same
   * meaning, and without it Ayara could eat herself to draw. */
  readonly otherOnly?: boolean;
  /** "Activate only if …" (rule 602.5, e.g. Ferocious — Fanatic of Rhonas:
   * "{T}: Add {G}{G}{G}{G}. Activate only if you control a creature with
   * power 4 or greater"). Mirrors `StaticAbility.condition` /
   * `TriggeredAbility.condition` — checked live, from the source's
   * controller's perspective. A mana ability gated this way is also excluded
   * from `Game.manaSources()`'s auto-payment scan while the condition is
   * false, not just from manual activation. needed-cards P19. */
  readonly condition?: StaticCondition;
  /**
   * Activatable from a zone other than the battlefield. The card leaving that
   * zone is an implicit, unconditional part of the cost (there's no `{T}` and
   * nothing to sacrifice), and the ability still goes on the stack like any
   * other activated ability.
   *
   * - `"hand"` — a Channel ability (rule 702.51a): "Channel — [cost], Discard
   *   this card: [effect]". Pays by **discarding** the source.
   * - `"graveyard"` — Runehorn Hellkite's "{5}{R}, Exile this card from your
   *   graveyard: …", and the shape Encore is built on. Pays by **exiling**
   *   the source.
   *
   * Which zone-change the cost is, is fixed per zone rather than configurable,
   * because that's what every printed card in the pool does. A graveyard
   * ability that doesn't exile itself would need a separate flag.
   */
  readonly zone?: "hand" | "graveyard";
  /** "Activate only once each turn" (rule 602.5g — Steel Hellkite). Tracked
   * per ability index on `GameObject.abilitiesUsedThisTurn`, so a permanent
   * with two such abilities limits each separately. */
  readonly oncePerTurn?: boolean;
  /** Boast (rule 702.135 — Dragonkin Berserker): activatable only if this
   * creature attacked this turn, and only once each turn. Implies
   * `oncePerTurn`; the "attacked this turn" half reads
   * `GameObject.attackedThisTurn`. */
  readonly boast?: boolean;
  /** A live cost reduction printed on the ability itself, mirroring
   * `CardDefinition.selfCostReduction` for a spell — the Kamigawa Channel
   * lands' "This ability costs {1} less to activate for each legendary
   * creature you control." Unlike `selfCostReduction` there's no gating
   * `condition`; every card needing one so far applies unconditionally. */
  readonly costReduction?: {
    readonly reduceGeneric: CostReductionAmount;
  };
}

/**
 * How much generic mana a cost reduction takes off: a fixed number, or a live
 * count read as the cost is determined.
 *
 * - `countOf`: permanents matching a filter (Blasphemous Act's creatures on
 *   the battlefield). Token stacks count as every token in them.
 * - `countersOnSource`: counters of one kind on the permanent doing the
 *   reducing (Animar, Soul of Elements: "{1} less for each +1/+1 counter on
 *   Animar").
 * - `cardsInGraveyard`: cards in *your* graveyard matching a filter (Karador,
 *   Ghost Chieftain: "{1} less for each creature card in your graveyard").
 */
export type CostReductionAmount =
  | number
  | { readonly countOf: CardFilter }
  | { readonly countersOnSource: string }
  | { readonly cardsInGraveyard: CardFilter };

/** Who the triggering object must be relative to the ability's source. */
export type TriggerWho =
  | "self"
  | "you-control"
  | "any"
  | "you"
  /** An opponent of this permanent's controller. Only meaningful where the
   * subject is a *player* — a `step-begins` trigger's "each opponent's end
   * step" (Archfiend of Depravity), which fires once per opponent's turn
   * rather than once per opponent. */
  | "opponent";

export type TriggerSpec =
  | {
      readonly on: "enters-battlefield";
      readonly who: TriggerWho;
      /** Narrow which entering permanent counts (Soul Warden: a creature;
       * landfall: a land). */
      readonly filter?: CardFilter;
      /** "another …" — the source permanent entering doesn't count. */
      readonly otherOnly?: boolean;
    }
  | {
      readonly on: "dies";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly otherOnly?: boolean;
    }
  | {
      /** A permanent left the battlefield — for any destination (graveyard,
       * exile, hand, library, command zone). Broader than `"dies"`, which
       * only fires for a move to a graveyard. Rule 603.6d / 700.4. */
      readonly on: "leaves-battlefield";
      readonly who: TriggerWho;
    }
  | {
      /** A player gained life (Ajani's Pridemate). `who` is whose life.
       * `{ triggerValue: true }` is how much ("that much" — Sanguine Bond).
       * Once per life-gain event: lifelink damage one source deals to several
       * things at once is one event. */
      readonly on: "gains-life";
      readonly who: TriggerWho;
    }
  | {
      /** A player lost life. `who` is whose life, `{ triggerValue: true }`
       * how much (Exquisite Blood). */
      readonly on: "loses-life";
      readonly who: TriggerWho;
    }
  | {
      /**
       * A player **played** a land (Flubs, the Fool; Burgeoning; Fastbond) —
       * the special action of rule 305.1, off `land-played`. Not landfall: a
       * land put onto the battlefield by an effect wasn't played (116.2a),
       * which is exactly the difference from an `enters-battlefield` trigger
       * filtered to lands.
       */
      readonly on: "plays-land";
      readonly who: TriggerWho;
    }
  | {
      /**
       * One or more counters were put on a permanent (rule 122.6, which
       * includes the counters it entered with) — Shalai and Hallar's
       * "whenever one or more +1/+1 counters are put on a creature you
       * control". Fires once per permanent per event, so counters put on two
       * creatures at once trigger twice (Hapatra's ruling). `who` / `filter`
       * are about the permanent, `counter` narrows the kind, and `byYou` is
       * "whenever **you** put …". `{ triggerValue: true }` is how many; the
       * permanent is the trigger object.
       */
      readonly on: "counters-put";
      readonly who: TriggerWho;
      readonly counter?: string;
      readonly filter?: CardFilter;
      readonly byYou?: boolean;
    }
  | {
      /**
       * A player drew a card (Nekusar, the Mindrazer; Niv-Mizzet, Parun;
       * Consecrated Sphinx; Smothering Tithe). `who` is who drew.
       *
       * Fires **once per card**, off `card-drawn`, so "draw three" triggers
       * three times, as the printed "whenever … draws a card" does. A draw
       * from an empty library draws nothing and doesn't fire it. The drawn
       * card is the trigger object, so "that player" is the
       * `"trigger-controller"` player scope (Nekusar: "deals 1 damage to that
       * player") — not a target, and not slot 0, which stays the ability's
       * own (Niv-Mizzet, Parun: "1 damage to any target").
       */
      readonly on: "draws";
      readonly who: TriggerWho;
      /** Only their Nth card of the turn — "whenever you draw your second
       * card each turn". */
      readonly nthEachTurn?: number;
      /** Not the first card they draw in their own draw step — Xyris, the
       * Writhing Storm's "except the first one they draw in each of their
       * draw steps". A draw in someone else's draw step still counts. */
      readonly exceptFirstInDrawStep?: boolean;
    }
  | {
      /**
       * A permanent became the target of a spell or ability (rule 115.7 /
       * 603.2) — Thunderbreak Regent's "Whenever a Dragon you control becomes
       * the target of a spell or ability an opponent controls".
       *
       * The triggering *player* (whoever targeted it) fills the ability's
       * first target slot automatically, the same way
       * `deals-combat-damage-to-player` fills it with the damaged player.
       */
      readonly on: "becomes-target";
      readonly who: TriggerWho;
      /** Narrow which targeted permanent counts (Thunderbreak Regent: "a
       * Dragon you control"). */
      readonly filter?: CardFilter;
      /** Only when the spell or ability belongs to an opponent of this
       * permanent's controller — which is how every printed card of this
       * shape words it. */
      readonly byOpponentOnly?: boolean;
    }
  | {
      /**
       * A **batched** attack trigger: "whenever one or more Dragons you
       * control attack" (The Ur-Dragon). Fires **once** per declaration
       * however many creatures matched, and supplies that count as the
       * trigger value, so "draw that many cards" is
       * `{ amount: { triggerValue: true } }`.
       *
       * Distinct from `attacks`, which fires once *per attacker* — the two
       * are not interchangeable and a card written with the wrong one either
       * over-triggers or loses its count. Hooks the `attackers-declared`
       * event, which is emitted once with the whole list, rather than the
       * per-attacker `attacker-declared`.
       *
       * The batched shape is a family, not a one-off: 28 of the 484
       * unimplemented top-500 commanders have a "whenever one or more …"
       * clause, across attacking, entering, being milled, dealing combat
       * damage and leaving a graveyard. This is the first of those event
       * types; the rest are the same idea against a different event.
       */
      readonly on: "attacks-batch";
      readonly who: TriggerWho;
      /** Narrow which attackers count toward the batch (Ur-Dragon: Dragons
       * you control). A declaration with no match doesn't fire at all. */
      readonly filter?: CardFilter;
    }
  | {
      readonly on: "attacks";
      readonly who: TriggerWho;
      /** Narrow which attacker counts (Utvara Hellkite / Atarka, World
       * Render: "a Dragon you control"). needed-cards P11. */
      readonly filter?: CardFilter;
      /**
       * Only when the attack is aimed at *this* permanent's controller —
       * Kazuul's "if you're the defending player".
       *
       * This also covers "a creature an opponent controls", the other half of
       * that card's wording: nobody can attack themselves, so an attacker
       * pointed at you is necessarily an opponent's.
       */
      readonly attackingYou?: boolean;
    }
  | {
      /** Exalted (rule 702.111a — needed-cards P15): a creature you control
       * attacked alone this combat — exactly one attacker was declared.
       * `who: "you-control"` = the lone attacker is yours. The attacker isn't
       * a target; an effect reads it via `ResolutionContext.triggerObject`
       * (a `modify-pt` with `target: "trigger-object"`). */
      readonly on: "attacks-alone";
      readonly who: TriggerWho;
    }
  | {
      /** A player sacrificed a permanent (Korvold, Mayhem Devil — rule 701.19).
       * `who` is relative to the sacrificing player: `"you"` = this permanent's
       * controller sacrificed one, `"any"` = anyone did. needed-cards P6. */
      readonly on: "sacrifice";
      readonly who: TriggerWho;
    }
  | {
      /** A permanent turned over to its other face (rule 712.10 — ROADMAP
       * Phase 10b). `who: "self"` = this permanent transformed; `"you-control"`
       * = one you control did. `intoFront` narrows to a transform *into* the
       * front (`true`) or back (`false`) face. */
      readonly on: "transforms";
      readonly who: TriggerWho;
      readonly intoFront?: boolean;
      readonly filter?: CardFilter;
    }
  | {
      /** This creature dealt combat damage to a player. The ability's first
       * target slot (if any) is auto-filled with that player, when the slot
       * can hold one. */
      readonly on: "deals-combat-damage-to-player";
      readonly who: TriggerWho;
      /** A filter on the creature that dealt the damage — Sharding Sphinx's
       * "whenever an **artifact** creature you control deals combat damage to
       * a player". */
      readonly filter?: CardFilter;
    }
  | {
      /** This creature was declared as a blocker — the mirror of `attacks`
       * (Kangee, Sky Warden's second half). */
      readonly on: "blocks";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
    }
  | {
      /**
       * A player discarded one or more cards — Sangromancer's "whenever an
       * opponent discards a card".
       *
       * Fires **once per discard event**, not once per card: `cards-discarded`
       * carries the whole batch, and a card printed this way ("whenever an
       * opponent discards a card, you may gain 3 life") would in the real
       * rules trigger once per card. The divergence only shows on a
       * multi-card discard; recorded in AUTHORING §15.
       */
      readonly on: "discards";
      readonly who: TriggerWho;
    }
  | {
      /**
       * A player declared an attack with at least `atLeast` creatures matching
       * `filter` — Overwhelming Instinct's "whenever you attack with three or
       * more creatures", Tide Skimmer's "two or more creatures with flying".
       *
       * Fires once per declaration, off the whole attacker list, which is why
       * it can't be spelled as an `attacks` trigger: that one fires per
       * attacker and can't see how many there are in total.
       */
      readonly on: "attack-with";
      readonly who: TriggerWho;
      readonly atLeast: number;
      readonly filter?: CardFilter;
      /** Only count attackers aimed at *this* permanent's controller or a
       * planeswalker they control — Ever-Watching Threshold's "whenever an
       * opponent attacks, **if they attacked you and/or a planeswalker you
       * control**". */
      readonly attackingYou?: boolean;
    }
  | {
      /**
       * This permanent *was dealt* damage — the receiving end, as opposed to
       * `deals-combat-damage-to-player`'s dealing end (Brash Taunter, Hornet
       * Nest). Combat and non-combat damage alike, which is the whole point
       * of the cards that carry it.
       *
       * `{ triggerValue: true }` is how much was dealt ("it deals **that
       * much** damage", "create **that many** tokens").
       */
      readonly on: "dealt-damage";
      readonly who: TriggerWho;
    }
  | {
      /** A permanent became tapped (rule 701.21a — City of Brass, Grand
       * Coliseum: "Whenever this land becomes tapped, it deals 1 damage to
       * you"). Fires for *any* tapping — paying a cost, a mana ability, or an
       * opponent's tap effect — which is why this can't be a `painToController`
       * mana ability instead: that only charges the mana-ability path. */
      readonly on: "becomes-tapped";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
    }
  /** `who: "you"` fires only on your own step, `"opponent"` only on an
   * opponent's (Archfiend of Depravity's "at the beginning of **each
   * opponent's** end step" — once per opponent's turn, not once per
   * opponent), `"any"` on everyone's. */
  | { readonly on: "step-begins"; readonly step: Step; readonly who: TriggerWho }
  | {
      /** A spell was cast. `who` is relative to the caster: `"you"` = this
       * permanent's controller cast it, `"opponent"` = anyone else did
       * (Kaervek the Merciless). `noncreatureOnly` narrows to a noncreature
       * spell (prowess, rule 702.108). `firstEachTurn` narrows to the
       * caster's first spell of the turn — or, with a `filter`, their first
       * *matching* spell ("your first enchantment spell each turn"), which
       * needn't be the first spell they cast. `nthEachTurn` counts the same
       * way. */
      readonly on: "cast-spell";
      readonly who: TriggerWho;
      /**
       * "…another Vampire spell" (Edgar Markov) — the source's own cast
       * doesn't count. Needed because the card on the stack is itself in the
       * trigger scan (that is how cascade and storm see their own cast), so
       * without this Edgar's Eminence fires as Edgar is cast.
       */
      readonly otherOnly?: boolean;
      readonly noncreatureOnly?: boolean;
      readonly firstEachTurn?: boolean;
      /** The caster's Nth spell this turn — Kraum, Ludevic's Opus's "casts
       * their second spell each turn" is `nthEachTurn: 2`. The general form
       * of `firstEachTurn`. */
      readonly nthEachTurn?: number;
      /**
       * A filter on the *spell* (Guttersnipe, Thermo-Alchemist: "whenever you
       * cast an instant or sorcery spell"). The general form of
       * `noncreatureOnly`, which predates it and is kept for the cards that
       * already use it — prowess is printed as its own word, not as a filter.
       */
      readonly filter?: CardFilter;
    }
  | {
      /** *This* spell (the one carrying the ability) was cast — a triggered
       * ability that lives on the card on the stack, not a permanent (cascade,
       * storm — rules 702.85 / 702.40). ROADMAP Phase 8. */
      readonly on: "this-cast";
    }
  /** Escape hatch: match the raw event yourself. */
  | { readonly on: "predicate"; readonly match: (event: GameEvent) => boolean };

export interface TriggeredAbility {
  /**
   * Eminence (rule 702.106) — this ability functions while its card is in the
   * **command zone**, not only on the battlefield (Edgar Markov: "whenever
   * you cast another Vampire spell, if Edgar Markov is in the command zone or
   * on the battlefield, …").
   *
   * Per *ability*, not per card, and that is the whole point: Edgar's first
   * strike, haste and attack trigger do nothing from the command zone. Only
   * the one clause that says so is marked.
   *
   * The engine's trigger scan and static scan both walk the battlefield, so
   * a marked ability adds its card to those scans from the command zone and
   * an unmarked one on the same card still doesn't appear.
   */
  readonly fromCommandZone?: boolean;
  readonly trigger: TriggerSpec;
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
  /**
   * An *intervening-if* clause (rule 603.4) — "When ~ enters, **if** you
   * control a creature with power 4 or greater, draw a card". The condition is
   * checked twice: as the trigger event happens (a false condition means the
   * ability never triggers at all) and again as the ability resolves (a
   * condition that has since become false removes it from the stack with no
   * effect). Evaluated from the source's controller's perspective, counting
   * the source itself. needed-cards P7.
   */
  readonly condition?: StaticCondition;
  readonly text: string;
}

/** The shape shared by both ability kinds once on the stack. */
export interface StackAbility {
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
}

/** A mana ability adds mana, has no targets, and never uses the stack. A cost
 * that includes a sacrifice disqualifies it (the engine's mana-source machinery
 * only knows how to pay a bare `{T}`). */
export function isManaAbility(ability: ActivatedAbility): boolean {
  return (
    // A loyalty ability uses the stack even if it adds mana (rule 606.3).
    ability.loyaltyCost === undefined &&
    ability.targets.length === 0 &&
    // A "Sacrifice this: Add …" mana ability (Treasure) is fine — the payment
    // machinery handles a self-sacrifice. A "sacrifice a creature you
    // control" cost isn't (it needs a choice).
    (ability.cost.sacrifice === undefined || ability.cost.sacrifice === "self") &&
    // A `Pay N life` cost is fine — a mana ability may cost life (rule 605.1a
    // says nothing about costs; the trikelands, City of Brass-likes). It's
    // auto-paid, same as a Phyrexian pip.
    ability.cost.removeCounter === undefined &&
    ability.cost.payEnergy === undefined &&
    ability.resolve === null &&
    ability.effect !== null &&
    ability.effect.kind === "add-mana"
  );
}

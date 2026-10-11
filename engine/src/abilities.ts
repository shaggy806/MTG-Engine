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

import type { StaticCondition, TurnStat } from "./cards/define.js";
import type { EffectSpec, SpellResolver } from "./effects.js";
import type { GameEvent } from "./events.js";
import type { GameState, PlayerCounterKind, ZoneType } from "./state.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { AggregateSpec, CardFilter } from "./filter.js";
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
   * a Forest"). needed-cards P6.
   *
   * With `count`, several of them: "Sacrifice two artifacts" (Sai, Master
   * Thopterist) is `count: 2`, "Sacrifice X Treasures" (Grim Hireling) is
   * `count: "x"` — the X announced for the activation (rules 107.3a, 602.2b),
   * which `"x"` in the effect then reads. Which ones is chosen as the cost is
   * paid (rule 601.2h), with the ordinary `sacrifice` decision, after the
   * ability is on the stack and its mana paid — never for the player — and a
   * compacted token stack counts as every token in it. All of them are
   * sacrificed at once. Without `count` it's one permanent, named on the
   * `activate-ability` action as before. */
  | { readonly filter: CardFilter; readonly count?: number | "x" }
  /** One permanent for each filter, every one a different permanent —
   * Jarad, Golgari Lich Lord's "Sacrifice a Swamp and a Forest" (a land that
   * is both still pays only one of them: its ruling). Asked one filter at a
   * time, each offering only what leaves the rest payable. */
  | { readonly each: readonly CardFilter[] };

/** One kind of permanent a sacrifice cost takes, and how many of it. */
export interface SacrificeCostPart {
  readonly filter: CardFilter;
  readonly count: number;
}

/**
 * The parts of a sacrifice cost that is chosen as it's paid rather than on
 * the action — a `count` or an `each` (see {@link SacrificeCost}) — with an
 * `"x"` count read at `x`. `null` for a cost that names its one permanent on
 * the action (`"self"`, `"creature-you-control"`, a bare `{ filter }`) or no
 * sacrifice at all.
 */
export function sacrificeCostParts(
  sacrifice: SacrificeCost | undefined,
  x: number,
): readonly SacrificeCostPart[] | null {
  if (sacrifice === undefined || typeof sacrifice === "string") return null;
  if ("each" in sacrifice) return sacrifice.each.map((filter) => ({ filter, count: 1 }));
  if (sacrifice.count === undefined) return null;
  return [{ filter: sacrifice.filter, count: sacrifice.count === "x" ? Math.max(0, Math.floor(x)) : sacrifice.count }];
}

/** Does this cost sacrifice X permanents — an `{X}` the mana cost needn't
 * have (Grim Hireling's "{B}, Sacrifice X Treasures")? */
export function sacrificeCostReadsX(cost: { readonly sacrifice?: SacrificeCost }): boolean {
  const sacrifice = cost.sacrifice;
  return typeof sacrifice === "object" && "filter" in sacrifice && sacrifice.count === "x";
}

/** Does any part of this cost besides its mana take X — so X is announced
 * though the mana cost needn't have `{X}` (Grim Hireling's "Sacrifice X
 * Treasures", Gix, Yawgmoth Praetor's "Discard X cards")? */
export function costAnnouncesX(cost: AbilityCost): boolean {
  return (
    sacrificeCostReadsX(cost) || cost.discard?.count === "x" || cost.exileFromGraveyard?.count === "x"
  );
}

/**
 * Can every part be paid at once, each with its own permanents? `eligible` is
 * what may pay a part, `capacity` how many each permanent can give (a token
 * stack as many as it has tokens; anything absent gives none). One permanent
 * never pays two parts — Jarad's Swamp that is also a Forest pays one of
 * "a Swamp and a Forest", not both. A search, but over a cost's few parts.
 */
export function sacrificePartsFillable(
  parts: readonly { readonly eligible: readonly ObjectId[]; readonly count: number }[],
  capacity: ReadonlyMap<ObjectId, number>,
): boolean {
  const left = new Map(capacity);
  const fill = (part: number, need: number, from: number): boolean => {
    if (part === parts.length) return true;
    const { eligible } = parts[part];
    if (need === 0) return fill(part + 1, parts[part + 1]?.count ?? 0, 0);
    // The last part has no one after it to leave anything for.
    if (part === parts.length - 1) {
      let n = 0;
      for (const id of eligible.slice(from)) n += left.get(id) ?? 0;
      return n >= need;
    }
    for (let i = from; i < eligible.length; i += 1) {
      const id = eligible[i];
      const has = left.get(id) ?? 0;
      if (has <= 0) continue;
      left.set(id, has - 1);
      const ok = fill(part, need - 1, i);
      left.set(id, has);
      if (ok) return true;
    }
    return false;
  };
  return fill(0, parts[0]?.count ?? 0, 0);
}

/** Every filter a sacrifice cost's choice can be made from — one for the
 * forms that have one, each of an `each`'s. */
export function sacrificeCostFilters(sacrifice: Exclude<SacrificeCost, "self" | "creature-you-control">): readonly CardFilter[] {
  return "each" in sacrifice ? sacrifice.each : [sacrifice.filter];
}

/**
 * How much life an activated ability's cost pays: a fixed number, or
 * `"commander-identity-colors"` — "Pay life equal to the number of colors in
 * your commanders' color identity" (War Room), read off
 * `PlayerState.commanderIdentity` (rule 903.4: fixed before the game begins,
 * both commanders' for a pair). A player with no commander can't pay it at
 * all (War Room's ruling), while a colourless commander makes it 0.
 */
export type AbilityLifeCost = number | "commander-identity-colors";

/**
 * The life `cost` pays when `player` activates it now: `0` for none, `null`
 * when it can't be paid at all (a commander-identity cost with no commander).
 * Rule 118.4's "can't pay more life than you have" is the caller's check.
 */
export function abilityLifeCost(
  state: GameState,
  player: PlayerId,
  cost: AbilityCost,
): number | null {
  const life = cost.payLife;
  if (life === undefined) return 0;
  if (typeof life === "number") return life;
  const hasCommander = Object.values(state.objects).some(
    (o) => o.isCommander && o.owner === player,
  );
  if (!hasCommander) return null;
  return state.players[player]?.commanderIdentity?.length ?? 0;
}

/** The printed form of an ability's life cost ("Pay 2 life"). */
export function abilityLifeCostText(life: AbilityLifeCost): string {
  return typeof life === "number"
    ? `Pay ${life} life`
    : "Pay life equal to the number of colors in your commanders' color identity";
}

export interface AbilityCost {
  /** Mana portion of the cost, e.g. `"{2}"`; `null` for no mana. */
  readonly mana: string | null;
  /** Whether `{T}` (tap this permanent) is part of the cost. */
  readonly tap: boolean;
  /** A sacrifice that is part of the cost, or `undefined` for none. */
  readonly sacrifice?: SacrificeCost;
  /** Life to pay as part of the cost (Greed: "Pay 2 life"). Rule 118.4 — a
   * player can't pay more life than they have. An {@link AbilityLifeCost}
   * other than a number is read as the ability is activated — always through
   * {@link abilityLifeCost}, never directly. */
  readonly payLife?: AbilityLifeCost;
  /** Counters to remove from the source as part of the cost (Walking
   * Ballista: "Remove a +1/+1 counter from ~"). */
  readonly removeCounter?: { readonly kind: string; readonly count: number };
  /**
   * Counters to put on the source as part of the cost — Wall of Roots' "Put
   * a -0/-1 counter on this creature: Add {G}", Devoted Druid's "Put a -1/-1
   * counter on this creature: Untap this creature". Put on directly as the
   * cost is paid (announced as `counter-added`, so a "whenever counters are
   * put" trigger sees them), with no counter replacement: a cost isn't an
   * effect, so one worded "if an effect would put counters" (Doubling
   * Season) never doubles it, as it never doubles a loyalty cost (its
   * ruling); the pool's others are +1/+1-only (Branching Evolution), which
   * no such cost puts yet — one that did would need them applied, as a
   * -1/-1 one (Vizier of Remedies) would; and a "counters can't be put on
   * it" (Solemnity, none in the pool) would make the cost unpayable (Devoted
   * Druid's rulings). A mana
   * ability with it and no `{T}` (once each turn) is one the auto-payer may
   * use, as a last resort, like a Treasure: the counter stays.
   */
  readonly addCounter?: { readonly kind: string; readonly count: number };
  /** Energy counters to pay ({E} — rule 122 / ROADMAP Phase 10; automatic,
   * like `payLife`). */
  readonly payEnergy?: number;
  /** Mill this many cards as part of the cost (Millikin: "{T}, Mill a card:
   * Add {C}"). Can't be paid with fewer cards than that in the library (rule
   * 701.17b), and a cost that moves a card from a library keeps an ability
   * that adds mana from being a mana ability (rule 605.1a), so it uses the
   * stack. Automatic, like `payLife`. */
  readonly mill?: number;
  /** Exile the source itself as part of the cost (Hanged Executioner:
   * "{3}{W}, Exile this creature: Exile target creature"). Distinct from
   * `sacrifice: "self"` — the source doesn't reach a graveyard, so nothing
   * that watches for a death sees one. */
  readonly exileSelf?: boolean;
  /** Return the source itself to its owner's hand as part of the cost
   * (Shigeki, Jukai Visionary's "{1}{G}, {T}, Return Shigeki to its owner's
   * hand: …"). Paid as the ability is activated, so nothing can answer it;
   * the ability resolves without its source, read as it last existed. */
  readonly returnSelfToHand?: boolean;
  /** Discard your whole hand as part of the cost (Slate of Ancestry: "{4},
   * {T}, Discard your hand: Draw a card for each creature you control").
   * Nothing to choose, so it's automatic like `payLife` — the empty hand is
   * a legal payment, which is why this never gates activation. */
  readonly discardHand?: boolean;
  /**
   * Discard `count` cards, matching `filter` if given, as part of the cost —
   * "{B}{B}, Discard a card: Proliferate" (Yawgmoth), "Discard a creature
   * card" (Fauna Shaman, Tortured Existence). The player picks which, with
   * the ordinary `discard` decision, as the ability goes on the stack (the
   * way a spell's `additionalCost.discard` is paid); the source itself never
   * counts. Gates activation on having enough such cards in hand. `count:
   * "x"` is Gix, Yawgmoth Praetor's "Discard X cards": X announced as it's
   * activated, capped by the cards there are to discard.
   */
  readonly discard?: { readonly count: number | "x"; readonly filter?: CardFilter };
  /**
   * Exile `count` cards from your graveyard, matching `filter` if given, as
   * part of the cost — "{2}, Exile two cards from your graveyard" (Varina,
   * Lich Queen), "Exile a creature card from your graveyard" (Moorland
   * Haunt). The player picks which as the ability goes on the stack (rule
   * 602.2b, paying costs as 601.2h does) — a `choose-from-zone` decision
   * with `destination: "exile"`, the way `discard` is paid with the
   * `discard` decision — and gets priority back once it's paid (rule
   * 117.3c). With no more matching cards than that, they're all exiled
   * without asking. Either way they leave the graveyard as one move. The
   * source never counts, wherever it is. Gates activation on having enough
   * such cards; not on a mana ability (there's nowhere for it to wait), nor
   * beside a `discard`, a `returnToHand` or a sacrifice of several, which ask
   * too. `count: "x"` is Necropolis Fiend's "{X}, {T}, Exile X cards from your
   * graveyard": the same X as the mana's, capped at the cards there.
   */
  readonly exileFromGraveyard?: { readonly count: number | "x"; readonly filter?: CardFilter };
  /**
   * Tap *other* permanents you control as part of the cost — Gravespawn
   * Sovereign's "Tap five untapped Zombies you control". Distinct from
   * `tap`, which taps the source itself.
   *
   * The controller picks which (`tap` on the `activate-ability` action,
   * offered as `tapCost`), because it matters: a creature tapped for the cost
   * can't attack or block this turn. A driver that doesn't choose gets the
   * summoning-sick ones first — they couldn't attack anyway.
   */
  readonly tapOthers?: {
    readonly count: number;
    /** Crew's form instead of a count (rule 702.122a): "tap **any number**
     * of other untapped creatures you control with **total power N or
     * greater**". `count` is then 0 and ignored; the tapped creatures'
     * powers as the cost is paid must add up to at least this. The `crew(n)`
     * helper writes it. */
    readonly totalPower?: number;
    readonly filter: CardFilter;
    /** Whether the ability's own source may be one of the permanents tapped.
     * True for Gravespawn Sovereign, which is itself a Zombie and has no
     * `{T}` of its own to conflict with. */
    readonly includeSelf?: boolean;
  };
  /**
   * Return `count` permanents you control matching `filter` to their
   * owner's hand as part of the cost — Quirion Ranger's "Return a Forest you
   * control to its owner's hand", Multani, Yavimaya's Avatar's "Return two
   * lands you control to their owner's hand". Which ones is chosen as the
   * cost is paid (rules 602.2b, 601.2h), once the ability is on the stack
   * and before anyone gets priority, with the `choose-permanents` decision —
   * asked only when there's a choice. Lands tapped for the ability's own
   * mana may be among them. Gates activation on controlling that many. Not
   * on a mana ability, nor beside a sacrifice or discard cost (each asks its
   * own question, and only one can wait at a time).
   */
  readonly returnToHand?: { readonly count: number; readonly filter: CardFilter };
}

export interface ActivatedAbility {
  readonly cost: AbilityCost;
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
  readonly text: string;
  /** True for abilities like Equip that function only as a sorcery (rule 602.3). */
  readonly sorcerySpeed?: boolean;
  /** This is a station ability (rule 702.184a — `cards/helpers.ts`'s
   * `station()`), which makes its card a station card (702.184b): one whose
   * printed power and toughness belong to a station symbol (721.2b). */
  readonly station?: boolean;
  /**
   * A loyalty ability (rule 606) — present ⇒ this ability's cost is "add
   * `loyaltyCost` loyalty counters to the source" (negative removes them),
   * it functions only as a sorcery, and only one loyalty ability of a given
   * permanent may be activated each turn. `cost.mana` / `cost.tap` are
   * ignored; a loyalty ability with a target is fine ("+1: Untap two target
   * lands"). Uses the stack like any other activated ability.
   */
  readonly loyaltyCost?: number;
  /** "Sacrifice **another** black creature" (Ayara, First of Locthwain) —
   * keeps the source out of its own **sacrifice cost**; without it Ayara
   * could eat herself to draw. Targets are another matter: "another target
   * artifact" (Manifold Key) is an `other` target spec on that slot. */
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
   *   the source, unless `staysInZone` says the cost doesn't move it.
   * - `"command"` — Derevi, Empyrial Tactician's "{1}{G}{W}{U}: Put Derevi
   *   onto the battlefield from the command zone." No zone-change cost: the
   *   card stays where it is until the ability resolves.
   *
   * Only the card's owner may activate it (a card in a hand, graveyard or the
   * command zone is controlled by nobody else). It is never a mana ability
   * (`isManaAbility`): mana abilities stay battlefield-only, so auto-payment
   * never reaches into another zone.
   *
   * An ability whose source stays put (`"command"`, or `staysInZone`) and
   * whose effect names `"source"` finds it only if it is still the same object
   * when the ability resolves (rule 400.7): the card leaving that zone —
   * Derevi cast in response, say, even if she comes back — makes `"source"`
   * name nothing, so the effect does nothing. See
   * `GameObject.zoneChangeCount`.
   */
  readonly zone?: "hand" | "graveyard" | "command";
  /**
   * A `zone: "graveyard"` ability whose cost *doesn't* exile the card
   * (Reassembling Skeleton: "{1}{B}: Return this card from your graveyard to
   * the battlefield tapped."). The card stays in the graveyard while the
   * ability is on the stack, so it can be activated again in response, and
   * the effect finds it only if it's still there (see `zone`). With `zone:
   * "hand"`, a hand ability that isn't channel: the card isn't discarded
   * (ninjutsu).
   */
  readonly staysInZone?: boolean;
  /** A ninjutsu ability (rule 702.49), as the `ninjutsu()` helper writes it:
   * the card is revealed from the hand as it's activated (702.49b). What "a
   * ninjutsu ability" names. */
  readonly ninjutsu?: true;
  /** "Activate only once each turn" (rule 602.5g — Steel Hellkite). Tracked
   * per ability index on `GameObject.abilitiesUsedThisTurn`, so a permanent
   * with two such abilities limits each separately. */
  readonly oncePerTurn?: boolean;
  /** Exhaust — "Activate each exhaust ability only once": once for as long
   * as the object exists, rather than once each turn (Loot, the
   * Pathfinder). Tracked per ability index on
   * `GameObject.exhaustedAbilities`, which a zone change clears — the
   * permanent that comes back is a new object (rule 400.7). */
  readonly exhaust?: boolean;
  /** Power-up (rule 702.193a): "Activate this ability only once", tracked as
   * `exhaust` is — and while its permanent is on the battlefield the turn it
   * entered, the ability costs less by that permanent's mana cost (702.193b,
   * rule 118.7 — see `Game.poweredUp`). */
  readonly powerUp?: boolean;
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
  /** The least X the ability may be activated with — Ruthless Technomancer's
   * "Sacrifice X artifacts: … X can't be 0." Absent: 0. The offer's
   * `xCost.minX` says it, and an activation below it is refused. */
  readonly minX?: number;
  /** "N damage divided as you choose among one or two targets" (Skarrgan
   * Hellkite): the targets from `slot` on — an `any-number` group — share
   * `total`, split as the ability is activated (rules 602.2b, 601.2d: the
   * `activate-ability` action's `division`, at least 1 each) and dealt by a
   * `damage-divided` effect. A target gone illegal loses its share. */
  readonly divided?: { readonly total: number; readonly slot: number };
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
 * - an `AggregateSpec`: a sum or maximum over matching permanents.
 */
export type CostReductionAmount =
  | number
  | { readonly countOf: CardFilter }
  | { readonly countersOnSource: string }
  | { readonly cardsInGraveyard: CardFilter }
  /** One per counter of a kind its controller has — Mizzix of the Izmagnus's
   * "{1} less to cast for each experience counter you have". */
  | { readonly playerCounters: PlayerCounterKind }
  /** A turn stat summed over players — Rakdos, Lord of Riots' "{1} less to
   * cast for each 1 life your opponents have lost this turn" is `{
   * turnStat: "life-lost", who: "opponent" }`; Heliod, the Warped Eclipse's
   * "for each card your opponents have drawn this turn" `"cards-drawn"`. */
  | { readonly turnStat: TurnStat; readonly who: "you" | "opponent" | "any-player" }
  /** A sum or maximum over permanents — Ghalta, Primal Hunger's "costs {X}
   * less to cast, where X is the **total power** of creatures you control".
   * Clamped at 0. See `AggregateSpec`. */
  | AggregateSpec;

/**
 * How an attacked player's life total compares with the other players', for
 * an `attacks` or `attacks-player` trigger. Only a *player* ranks: a
 * creature attacking a planeswalker is attacking that planeswalker (rule
 * 508.3a), so it never meets one of these. Players who have left the game
 * aren't compared.
 */
export type DefenderLife =
  /** Dethrone (rule 702.105a): "attacks the player with the most life or
   * tied for most life" — among every player in the game, this permanent's
   * controller included, so attacking an opponent while you have the most
   * life doesn't count unless they're tied with you. A trigger condition,
   * not an intervening-if: asked as the attack is declared and never again,
   * so the counter still goes on if life totals change before it resolves. */
  | "most"
  /** "…, if that opponent has more life than another of your opponents"
   * (Breena, the Demagogue): more than at least one *other* opponent of this
   * permanent's controller. An intervening-if (rule 603.4), so it's asked
   * again as the ability resolves, of the same attacked player. */
  | "more-than-another-opponent"
  /** "…, **if it's attacking** the player with the most life or tied for
   * most life" (Scourge of the Throne): `"most"` as an intervening-if (rule
   * 603.4), asked again as the ability resolves of the player the attacker
   * is attacking then — as it last existed if it has left the battlefield,
   * and nobody if it has been removed from combat (the ruling: unlike
   * dethrone, it must hold at both times). */
  | "most-still-attacking";

/** Who the triggering object must be relative to the ability's source. */
export type TriggerWho =
  | "self"
  | "you-control"
  | "any"
  | "you"
  /** An opponent of this permanent's controller. Where the subject is a
   * *player*, that player is an opponent — a `step-begins` trigger's "each
   * opponent's end step" (Archfiend of Depravity), which fires once per
   * opponent's turn rather than once per opponent. Where it is an *object*,
   * an opponent controls it ("whenever a creature an opponent controls
   * dies"), read as it last existed on the battlefield if it has left. */
  | "opponent"
  /**
   * The permanent this one is attached to — "**equipped** creature",
   * "**enchanted** creature / land / permanent" (Skullclamp, Wild Growth, the
   * Swords): the Equipment's or Aura's host as the event happened, whoever
   * controls it. The trigger is still the Equipment's or Aura's, and its
   * controller's. A host that has left ("equipped creature dies") is matched
   * by the host its source had then — remembered by a source that left at
   * the same time (`LastKnownInfo.attachedTo`).
   */
  | "attached"
  /** A permanent the player this Aura is attached to controls — a Curse's
   * "Whenever a creature **enchanted player controls** enters" (Trespasser's
   * Curse), read as it last existed if it has left. The trigger is the
   * Curse's, and its controller's. */
  | "enchanted-player-controls"
  /** This ability's controller's **Ring-bearer** (rule 701.54a) — the Ring
   * emblem's "whenever your Ring-bearer attacks". */
  | "ring-bearer";

export type TriggerSpec =
  | {
      /**
       * "Whenever the Ring tempts you" (rule 701.54d): once the player has
       * chosen a Ring-bearer, or found no creature to choose. The creature
       * chosen is the trigger object (Gandalf, Friend of the Shire's "if you
       * chose a creature other than Gandalf"); with `chosen`, only a
       * temptation that chose one fires it — Call of the Ring's "whenever
       * you choose a creature as your Ring-bearer", the same creature again
       * included. `who` is the tempted player.
       */
      readonly on: "ring-tempts";
      readonly who: TriggerWho;
      readonly chosen?: boolean;
    }
  | {
      /**
       * "Whenever you roll one or more dice" (rule 706): once per roll,
       * however many dice it took (Brazen Dwarf). `{ triggerValue: true }`
       * is the roll's natural total. `who` is the player who rolled.
       */
      readonly on: "rolls-dice";
      readonly who: TriggerWho;
    }
  | {
      /**
       * A Room's door was unlocked (rule 709.5h) — the `door-unlocked` event.
       * "When you unlock this door" is `who: "self"` with `door` the half
       * that prints it (the `room()` helper writes it), and it triggers as
       * that door unlocks however it does: entering with it unlocked (the
       * half cast), its unlock cost, or an effect. "Whenever you fully unlock
       * a Room" (Entity Tracker's eerie) is `fully: true` (709.5i), `who` the
       * Room's controller. `filter` narrows the Room.
       */
      readonly on: "class-level-gained";
      /** "When this Class becomes level `level`" (rule 716.2a): `who: "self"`. */
      readonly who: TriggerWho;
      readonly level: number;
    }
  | {
      readonly on: "door-unlocked";
      readonly who: TriggerWho;
      readonly door?: "left" | "right";
      readonly fully?: boolean;
      readonly filter?: CardFilter;
    }
  | {
      /**
       * A face-down permanent was turned face up (rule 708.8) — the
       * `permanent-turned-face-up` event, however it was turned (its cost, or
       * an effect). "When this creature is turned face up" (Den Protector,
       * Rattleclaw Mystic) is `who: "self"`: the permanent has its abilities
       * from then on, so this one triggers. "Whenever a permanent you control
       * is turned face up" (Trail of Mystery) is `who: "you-control"`, its
       * trigger object the permanent; `filter` narrows it, as it is now.
       */
      readonly on: "turned-face-up";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
    }
  | {
      readonly on: "enters-battlefield";
      readonly who: TriggerWho;
      /** Narrow which entering permanent counts (Soul Warden: a creature;
       * landfall: a land). */
      readonly filter?: CardFilter;
      /** "another …" — the source permanent entering doesn't count. */
      readonly otherOnly?: boolean;
      /** "Whenever **one or more** … enter" (Marneus Calgar's tokens): once
       * per simultaneous entry, however many of its permanents match — a
       * batch of tokens, a mass reanimation. Its trigger object is the first
       * of them to match; don't read it. */
      readonly batched?: boolean;
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
      /** Matched against the permanent as it last existed on the battlefield
       * — "a creature you control", "if it had one or more +1/+1 counters on
       * it" (a `counters` clause). */
      readonly filter?: CardFilter;
      /** "Another …" — not this permanent itself. */
      readonly otherOnly?: boolean;
      /** Only for these destinations — Reyhan, Last of the Abzan's "dies or
       * is put into the command zone" is `["graveyard", "command"]`. */
      readonly to?: readonly ("graveyard" | "exile" | "hand" | "library" | "command")[];
    }
  | {
      /** A player gained life (Ajani's Pridemate). `who` is whose life.
       * `{ triggerValue: true }` is how much ("that much" — Sanguine Bond).
       * Once per life-gain event: lifelink damage one source deals to several
       * things at once is one event. */
      readonly on: "gains-life";
      readonly who: TriggerWho;
      /** "Whenever you gain life **for the first time each turn**"
       * (Gourmand's Talent): only the gain that took the player's life gained
       * this turn from none — one earlier in the turn, even before this
       * permanent arrived, uses it up. Reads `PlayerState.lifeGainedThisTurn`,
       * which already counts this gain when the trigger is matched. */
      readonly firstTimeEachTurn?: boolean;
    }
  | {
      /** A player lost life. `who` is whose life, `{ triggerValue: true }`
       * how much (Exquisite Blood). */
      readonly on: "loses-life";
      readonly who: TriggerWho;
      /** "…loses life **for the first time during each of their turns**"
       * (Valgavoth, Harrower of Souls): only while that player is the active
       * player, and only the loss that took their life lost this turn from
       * none — so a loss earlier in the turn, even one before this permanent
       * arrived, uses it up. Reads `PlayerState.lifeLostThisTurn`, which
       * already counts this loss when the trigger is matched. */
      readonly firstDuringTheirTurn?: boolean;
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
      /** "When you play **another** land" (City of Traitors): playing this
       * land itself doesn't count — it's on the battlefield by the time its
       * own play is announced. */
      readonly otherOnly?: boolean;
    }
  | {
      /**
       * A player **played a card** — played a land *or* cast a spell, since
       * "play" covers both (rule 601.2 / 305.1). `from` narrows it to the
       * zone the card was played from: Prosper, Tome-Bound's "whenever you
       * play a card **from exile**" fires on a land played off an impulse
       * exile as well as on a foretold, suspended, cascaded or adventure card
       * cast from there. Reads the `from` recorded on `land-played` and
       * `spell-cast` (a copy of a spell is never *cast* here, so it never
       * counts — rule 707.10).
       */
      readonly on: "plays-card";
      readonly who: TriggerWho;
      readonly from?: ZoneType;
      /** A filter on the card played — the land on the battlefield, the
       * spell on the stack: Rendmaw, Creaking Nest's "a card with two or
       * more card types". */
      readonly filter?: CardFilter;
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
      /** Only a *spell* targeting it counts, not an activated ability —
       * "becomes the target of a spell" (Gargos, Vicious Watcher; Tectonic
       * Giant). */
      readonly spellOnly?: boolean;
      /** The ability's targets are all its controller's choice: the
       * targeting player never fills its first slot — Venerated Rotpriest's
       * "target opponent gets a poison counter" may name any opponent, not
       * only the one whose spell it was. */
      readonly targeterNotTarget?: boolean;
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
      /**
       * A creature was declared as an attacker (rule 508.3a) — once per
       * attacker. The attacker is the trigger object ("it gets +X/+X") and
       * the player it attacks, or the controller of the planeswalker it
       * attacks, is the `"trigger-player"` ("defending player", "that
       * opponent"). Triggers see the whole declaration: every attacker is
       * attacking before the first of these fires (rule 508.3 — triggers on
       * attackers being declared trigger once they all have been). A
       * creature put onto the battlefield attacking was never declared and
       * doesn't fire it.
       */
      readonly on: "attacks";
      readonly who: TriggerWho;
      /** Narrow which attacker counts (Utvara Hellkite / Atarka, World
       * Render: "a Dragon you control"). needed-cards P11. */
      readonly filter?: CardFilter;
      /** "Whenever **another** Cat you control attacks" (Arahbo, Roar of the
       * World) — this permanent attacking doesn't count. */
      readonly otherOnly?: boolean;
      /**
       * Only when the attack is aimed at *this* permanent's controller —
       * Kazuul's "if you're the defending player".
       *
       * This also covers "a creature an opponent controls", the other half of
       * that card's wording: nobody can attack themselves, so an attacker
       * pointed at you is necessarily an opponent's.
       */
      readonly attackingYou?: boolean;
      /**
       * What it must be attacking: `"player"` is "attacks **a player**" /
       * "attacks **an opponent**" (Kaalia of the Vast) — a creature attacking
       * a planeswalker is attacking that planeswalker, not its controller
       * (rule 508.3a), so that doesn't fire it; `"planeswalker"` is the
       * reverse.
       */
      readonly defender?: "player" | "planeswalker";
      /**
       * "…, **if no other creatures are attacking that player**" — an
       * intervening-if (rule 603.4) over the declaration: no other creature
       * is attacking the player or planeswalker this one attacks. Checked
       * again as the ability resolves, so a creature put onto the
       * battlefield attacking that player in the meantime stops it.
       */
      readonly aloneAgainstDefender?: boolean;
      /** How the attacked player's life total ranks — dethrone's "attacks
       * the player with the most life or tied for most life". See
       * {@link DefenderLife}. */
      readonly defenderLife?: DefenderLife;
      /** "Whenever this creature attacks **for the first time each turn**"
       * (Scourge of the Throne): only a declaration of an attacker that
       * hadn't been declared one earlier this turn — a later combat's
       * attack doesn't fire it. */
      readonly firstTimeEachTurn?: boolean;
    }
  | {
      /**
       * "Whenever a player attacks one of your opponents" (Breena, the
       * Demagogue); "whenever an opponent attacks you". Fires **once per
       * player attacked** — a declaration with creatures attacking two of
       * your opponents triggers it twice, and one with ten creatures attacking
       * one of them once — off `player-attacked`. A creature attacking a
       * planeswalker attacks that planeswalker, not its controller (rule
       * 508.3a), so it counts for nobody here.
       *
       * `who` is the attacking player and `defender` the attacked one, each
       * relative to this permanent's controller (`"you"`, `"opponent"`,
       * `"any"`). The attacked player is the `"trigger-player"` ("that
       * opponent"); the attacking player is the active player, which is the
       * `"active-player"` scope ("that attacking player draws a card").
       * `{ triggerValue: true }` is how many creatures attack that player.
       */
      readonly on: "attacks-player";
      readonly who: TriggerWho;
      readonly defender: TriggerWho;
      /** How the attacked player's life total ranks — Breena's "if that
       * opponent has more life than another of your opponents". See
       * {@link DefenderLife}. */
      readonly defenderLife?: DefenderLife;
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
       * controller sacrificed one, `"any"` = anyone did. needed-cards P6.
       * `filter` narrows it ("whenever you sacrifice a **nontoken**
       * permanent", "…a Food"), matched against the permanent as it last
       * existed on the battlefield; `otherOnly` is "another". The sacrificed
       * permanent is the trigger object ("its power", "that creature"). */
      readonly on: "sacrifice";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly otherOnly?: boolean;
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
      /** A permanent became monstrous (rule 701.37 — the `monstrosity`
       * effect): "when this creature becomes monstrous" is `who: "self"`.
       * Never fires for a permanent that was monstrous already, or that left
       * the battlefield before its monstrosity ability resolved (the
       * rulings). The permanent is the trigger object, and `{ triggerValue:
       * true }` the N it became monstrous with (701.37c's X). */
      readonly on: "becomes-monstrous";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
    }
  | {
      /** A permanent was exerted (rule 701.43). `asItAttacks` is the "when
       * you do" linked to a creature's own "you may exert this creature as it
       * attacks" (rule 607.2h — Glorybringer, Combat Celebrant): only that
       * exert fires it, not one some other effect makes. The permanent is the
       * trigger object. */
      readonly on: "exerted";
      readonly who: TriggerWho;
      readonly asItAttacks?: boolean;
    }
  | {
      /**
       * A permanent was tapped for mana — its mana ability with `{T}` in the
       * cost resolved (Roxanne, Starfall Savant's "whenever you tap an
       * artifact token for mana, add one mana of any type that artifact
       * token produced"; Crypt Ghast's "whenever you tap a Swamp for mana,
       * add an additional {B}"). A **triggered mana ability** (rule 605.1b):
       * it never uses the stack, but is applied at once, as the mana is
       * made — and the auto-payer counts it, so the extra mana pays too. Its
       * effect is an `add-mana`, whose `mana: "produced"` is "one mana of any
       * type that permanent produced". `who` is about the tapped permanent
       * (`"you-control"`: "whenever you tap …").
       */
      readonly on: "tapped-for-mana";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      /** "Whenever you tap a land **for {C}**" (Ultima, Origin of
       * Oblivion): only when what it made includes colorless mana — once,
       * however much. */
      readonly producing?: "C";
    }
  | {
      /** A Saga's chapter ability resolved — `finalOnly` is "whenever the
       * **final chapter ability** of a Saga you control resolves" (Tom
       * Bombadil, Narci, Fable Singer). `who` is about the Saga (`"self"`: a
       * Saga's own). The Saga is the trigger object: "that Saga's mana value"
       * is a `{ manaValueOf: "trigger-object" }`, read as it last existed if
       * the final chapter has sacrificed it by then. */
      readonly on: "chapter-resolves";
      readonly who: TriggerWho;
      readonly finalOnly?: boolean;
      readonly filter?: CardFilter;
    }
  | {
      /** This creature dealt combat damage to a player — "that player" is
       * the `"trigger-player"` scope (Xyris, Captain N'ghathrod); a target
       * slot is always the controller's choice (Mindscour Dragon's "target
       * player mills four", Sword of Fire and Ice's "any target"). The
       * creature is the trigger object — "you gain life
       * equal to **that creature's** toughness" (Ikra Shidiqi), read as it
       * last existed on the battlefield if the same damage killed it — and
       * `{ triggerValue: true }` is how much it dealt. */
      readonly on: "deals-combat-damage-to-player";
      readonly who: TriggerWho;
      /** A filter on the creature that dealt the damage — Sharding Sphinx's
       * "whenever an **artifact** creature you control deals combat damage to
       * a player". */
      readonly filter?: CardFilter;
      /** "Whenever **another** creature you control deals combat damage to
       * a player". */
      readonly otherOnly?: boolean;
      /** "…to a player **who controls more lands than you**" (Cartographer's
       * Hawk): the player dealt damage controls more permanents matching
       * this than this permanent's controller does, counted as the damage is
       * dealt. Part of the trigger event, not an intervening-if (rule 603.4):
       * it isn't asked again as the ability resolves. */
      readonly toPlayerControlsMore?: CardFilter;
      /** "…deals combat damage to **one of your opponents**" (Gix, Yawgmoth
       * Praetor, with `who: "any"`): the player dealt damage is an opponent
       * of this permanent's controller, whoever's creature dealt it. */
      readonly toOpponent?: boolean;
    }
  | {
      /**
       * A **batched** damage trigger: "whenever one or more creatures you
       * control deal combat damage to a player" (Goro-Goro and Satoru,
       * Alela, Anowon, Professional Face-Breaker) — **once per player**
       * dealt damage by at least one matching source in one simultaneous
       * damage event (a combat damage step; first-strike and regular damage
       * are two, rule 510.4), however many sources dealt it. It is settled
       * as that event's damage is, like enrage.
       *
       * `who` / `filter` are about the sources ("one or more **Pirates** you
       * control"); `to: "opponent"` narrows the players; `combat` is `true`
       * for combat damage only ("deal combat damage") or `false` for
       * noncombat, and left off for any. The player is the
       * `"trigger-player"` ("that player"), and `{ triggerValue: true }` is
       * the total those sources dealt them ("mills a card for each 1 damage
       * dealt to them"). `once: "per-event"` fires once for the whole event
       * instead, with `{ triggerValue: true }` the number of players dealt
       * damage and no trigger player — Malcolm, Keen-Eyed Navigator's "you
       * create a Treasure token for each opponent dealt damage".
       */
      readonly on: "deals-damage-batch";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly to?: "player" | "opponent";
      readonly combat?: boolean;
      readonly once?: "per-player" | "per-event";
    }
  | {
      /** This creature was declared as a blocker — the mirror of `attacks`
       * (Kangee, Sky Warden's second half). Once per blocker, which is the
       * trigger object ("whenever a creature you control attacks or blocks,
       * **it** gets +X/+X" — Doran, Besieged by Time). */
      readonly on: "blocks";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly otherOnly?: boolean;
    }
  | {
      /**
       * An attacking creature **became blocked** (rules 509.1h, 509.3c) —
       * "whenever Anzrag becomes blocked". Once per attacker, however many
       * creatures block it, as its defending player's declaration completes,
       * off `attacker-blocked`. The attacker is the trigger object, and its
       * defending player (the one who blocked) the `"trigger-player"`. A
       * creature nobody blocks doesn't fire it, and one whose blockers are
       * all removed from combat afterward is still blocked (rule 509.1h)
       * without firing again.
       */
      readonly on: "becomes-blocked";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly otherOnly?: boolean;
    }
  | {
      /**
       * An attacking creature became blocked **by a creature** — once per
       * blocker, as the declaration completes, off `blocker-declared`
       * (flanking, rule 702.25a: "whenever this creature becomes blocked by a
       * creature without flanking, the blocking creature gets -1/-1 until end
       * of turn" — the `flanking()` helper). `who` / `filter` are about the
       * attacker, `blocker` about the blocking creature, asked as the block
       * is declared; the blocker is the trigger object.
       */
      readonly on: "blocked-by";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly blocker?: CardFilter;
    }
  | {
      /**
       * A **batched** graveyard trigger: "whenever one or more cards leave
       * your graveyard" (Teval, the Balanced Scale; Tormod, the Desecrator),
       * narrowed by `filter` for "one or more **artifact** cards" (Imotekh
       * the Stormlord). Fires **once per simultaneous move**, however many
       * cards it took — exiling a whole graveyard, returning several cards
       * at once, an escape cost's exile — off the `cards-left-graveyard`
       * event. Separate moves are separate triggers, including the two halves
       * of an escape cast: the card moving to the stack (rule 601.2a) and the
       * cards exiled to pay for it (601.2h).
       *
       * `who` is whose graveyard: `"you"` (this permanent's controller's),
       * `"opponent"`, `"any"`. `filter` is matched against each card as it
       * was in the graveyard (rule 603.10a — these abilities look back in
       * time), so a card that became an artifact on its way to the
       * battlefield doesn't count, and a multi-face card is its front face
       * (rule 712.8a — a creature // land played as its land left as a
       * creature card); a move with nothing matching doesn't fire. A
       * commander returned to hand leaves with the rest of its move whether
       * its owner sends it to the command zone instead or not (rule 903.9b).
       * `{ triggerValue: true }` is how many cards counted. A permanent that
       * was itself one of the cards (a reanimated Teval) wasn't on the
       * battlefield to see them leave, and doesn't trigger.
       *
       * `perCard` is the per-card form — "whenever a creature card leaves
       * your graveyard" (Syr Konrad, the Grim): once per matching card,
       * however many left together, each card the trigger object.
       */
      readonly on: "leaves-graveyard";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly perCard?: boolean;
    }
  | {
      /**
       * Cards were put into a graveyard — "whenever one or more land cards
       * are put into your graveyard from anywhere" (The Gitrog Monster:
       * `batched`), "…creature cards … from your library" (Sidisi, Brood
       * Tyrant: `from: "library"`), "whenever a creature card is put into a
       * graveyard from anywhere other than the battlefield" (Syr Konrad, the
       * Grim: `notFrom: "battlefield"`), "whenever a Lhurgoyf permanent card
       * is put into your graveyard from anywhere other than the battlefield,
       * put it onto the battlefield" (Disa the Restless). Off
       * `cards-put-into-graveyard`, which groups what one simultaneous move
       * put there: a wrath or a state-based sweep, one mill, discard or
       * surveil. Tokens aren't cards and never count.
       *
       * `who` is whose graveyard (the card's owner); `filter` is matched
       * against each card as it is there; `from` / `notFrom` are the zone it
       * came from. `batched` ("one or more") fires once per move, with
       * `{ triggerValue: true }` how many counted; otherwise once per card,
       * that card the trigger object — "put **it** onto the battlefield",
       * which finds it in that graveyard and nowhere else (rule 400.7). This
       * permanent dying along with them doesn't see them (it's in the
       * graveyard too by then).
       */
      readonly on: "put-into-graveyard";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly from?: ZoneType;
      readonly notFrom?: ZoneType;
      readonly batched?: boolean;
    }
  | {
      /** A player surveilled (rule 701.42) — Mirko, Obsessive Theorist's
       * "whenever you surveil". Once per surveil, however many cards. */
      readonly on: "surveils";
      readonly who: TriggerWho;
    }
  | {
      /** A player won a coin flip (rule 705) — "whenever a player wins a
       * coin flip" (Okaun, Zndrsplt: `who: "any"`), "whenever you win a coin
       * flip" (`"you"`). Once per flip won. */
      readonly on: "wins-coin-flip";
      readonly who: TriggerWho;
    }
  | {
      /**
       * One or more cards were put into exile at once — Ketramose, the New
       * Dawn's "whenever one or more cards are put into exile from
       * graveyards and/or the battlefield during your turn" (`from:
       * ["graveyard", "battlefield"]`, with a `your-turn` condition). Once
       * per simultaneous move (`cards-put-into-exile`), `who` being whose
       * cards they are and `filter` asked of them in exile. Tokens aren't
       * cards. `{ triggerValue: true }` is how many.
       */
      readonly on: "put-into-exile";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly from?: readonly ZoneType[];
    }
  | {
      /**
       * A player discarded one or more cards — "whenever you discard one or
       * more cards" (Captain Howler, Sea Scourge), once per discard event,
       * with `{ triggerValue: true }` how many matched. `filter` narrows the
       * cards, as they are in the graveyard. `perCard` is "whenever an
       * opponent discards a card" — once per card, each its trigger object,
       * followed to the graveyard and no further (Tergrid, God of Fright's
       * "you may put that card onto the battlefield under your control" is
       * `filter: { typesAnyOf: [<the permanent types>] }` and a
       * `put-onto-battlefield` of `"trigger-object"`).
       */
      readonly on: "discards";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly perCard?: boolean;
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
      /** Count only this permanent and your commanders — "whenever you
       * attack with this creature **and/or your commander**" (Ainok Strike
       * Leader). Your commander is one you own (rule 903.3), whoever's
       * creature it was before. */
      readonly thisOrYourCommander?: boolean;
      /** Only count attackers aimed at *this* permanent's controller or a
       * planeswalker they control — Ever-Watching Threshold's "whenever an
       * opponent attacks, **if they attacked you and/or a planeswalker you
       * control**". */
      readonly attackingYou?: boolean;
      /**
       * The count is an intervening if in the present tense — Mangara, the
       * Diplomat's "if two or more of those creatures **are** attacking you
       * and/or planeswalkers you control" — so it's asked again as the
       * ability resolves (rule 603.4): a creature removed from combat no
       * longer counts, one that has left the battlefield counts by what it
       * was attacking (the rulings).
       */
      readonly stillAttacking?: boolean;
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
      /** Narrow which permanent dealt damage counts — Sonic the Hedgehog's
       * "a creature you control **with flash or haste**". Read as the damage
       * is dealt, before state-based actions can have killed it. */
      readonly filter?: CardFilter;
      /** `true`: combat damage only; `false`: noncombat damage only. */
      readonly combat?: boolean;
    }
  | {
      /**
       * A source *dealt* damage — the dealing end, for any recipient and any
       * kind of damage (rule 120.1). Ghyrson Starn's "whenever another source
       * you control deals exactly 1 damage to a permanent or player",
       * Niv-Mizzet, Visionary's "whenever a source you control deals
       * noncombat damage to an opponent", Kediss's "whenever a commander you
       * control deals combat damage to an opponent".
       *
       * Fires once per damage event per recipient: a source that deals damage
       * to three things at once (a `damage-all`, "each opponent", a trampler
       * and its blocker) triggers three times, each with the amount *that*
       * recipient was dealt. That amount is after prevention and doubling —
       * damage that was prevented was never dealt (rule 615.1), so it doesn't
       * trigger at all, and 2 damage prevented down to 1 is "exactly 1".
       *
       * `{ triggerValue: true }` is the amount dealt; the source is the
       * trigger object ("it deals that much damage"); the recipient is what
       * a `damage` effect's `toTriggerRecipient` hits, and a player
       * recipient (or a permanent recipient's controller) is the
       * `"trigger-player"` scope — "that player", "each **other** opponent".
       */
      readonly on: "deals-damage";
      /** Whose the *source* is, relative to this permanent: `"self"` (this
       * deals damage), `"you-control"` (a source you control — a spell, a
       * permanent, or the source of an ability), `"opponent"`, `"any"`. A
       * source that has left the battlefield is judged as it last existed
       * there. */
      readonly who: TriggerWho;
      /** A filter on the source ("a commander you control", "an instant or
       * sorcery spell you control"). */
      readonly filter?: CardFilter;
      /** "**another** source" — this permanent's own damage doesn't count. */
      readonly otherOnly?: boolean;
      /** What the damage was dealt to. Omitted: any permanent or player.
       * `"you"` is this permanent's controller — Mikaeus, the Unhallowed's
       * "whenever a Human deals damage to you". */
      readonly to?: "player" | "opponent" | "you" | "permanent" | "creature" | "planeswalker";
      /** A filter on a *permanent* recipient ("deals damage to a creature an
       * opponent controls"). Never matches a player. */
      readonly toFilter?: CardFilter;
      /** `true`: combat damage only; `false`: noncombat damage only. */
      readonly combat?: boolean;
      /** Only exactly this much damage to that recipient (Ghyrson Starn's
       * "exactly 1 damage"). */
      readonly exactly?: number;
      /** Only damage a *spell* deals to one of its own targets — "an instant
       * or sorcery spell you control deals damage to a permanent or player it
       * targets". A source that isn't a spell on the stack never matches (an
       * ability's damage is dealt by its source permanent, which has no
       * targets of its own). */
      readonly toItsTarget?: boolean;
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
  | {
      /** A creature fought (rule 701.14) — Foe-Razer Regent's "whenever a
       * creature you control fights": each creature in a fight is one that
       * fights, so a fight between two of yours fires twice. Its trigger
       * object is the creature that fought. */
      readonly on: "fights";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
    }
  | {
      /** A permanent became untapped (rule 701.26b) — Key to the City's
       * "whenever this artifact becomes untapped": in an untap step or by
       * any effect. Not a shock land whose life was paid as it entered: that
       * one enters untapped (rule 614.1c), which untaps nothing, though the
       * engine turns it upright after it has arrived (`permanent-untapped`'s
       * `asItEntered`). */
      readonly on: "becomes-untapped";
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
       * Also fire when the player **copies** a spell (rule 707.10 — a copy
       * isn't cast): Magecraft's "whenever you cast **or copy** an instant or
       * sorcery spell" (Archmage Emeritus). `who` is who controls the copy,
       * `filter` asks about the copy, and the copy is the trigger object. The
       * cast-only narrowings (`from`, `notFrom`, `firstEachTurn`,
       * `nthEachTurn`) never match a copy.
       */
      readonly orCopy?: boolean;
      /** Fire **only** when the player copies a spell — Kalamax, the
       * Stormsire's "whenever you copy an instant spell". As `orCopy`
       * otherwise. */
      readonly copyOnly?: boolean;
      /**
       * "…another Vampire spell" (Edgar Markov) — the source's own cast
       * doesn't count. Needed because the card on the stack is itself in the
       * trigger scan (that is how cascade and storm see their own cast), so
       * without this Edgar's Eminence fires as Edgar is cast.
       */
      readonly otherOnly?: boolean;
      /** Only a spell cast **from** this zone ("whenever you cast a spell
       * from exile") — the `from` recorded on the `spell-cast` event. */
      readonly from?: ZoneType;
      /** Only a spell cast from anywhere **but** this zone ("whenever you
       * cast a spell from anywhere other than your hand"). */
      readonly notFrom?: ZoneType;
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
      /** Only a **modal** spell — one whose modes were chosen as it was cast
       * (rule 700.2; a `castModal` card): Riku of Many Paths' "whenever you
       * cast a modal spell". `{ triggerValue: true }` is then the number of
       * times a mode was chosen for it. */
      readonly modal?: boolean;
      /** Only a spell with one or more targets — Voracious Bibliophile's
       * "whenever you cast a spell with one or more targets". `{ triggerValue:
       * true }` is then how many targets it has ("draw that many cards"). */
      readonly withTargets?: boolean;
      /**
       * Make `{ triggerValue: true }` the number of spells matching this
       * filter that the caster cast this turn **before** this one — read as
       * it triggers, so a spell cast in response doesn't change it, and each
       * earlier spell read as it was cast. Thousand-Year Storm's "copy it for
       * each other instant and sorcery spell you've cast before it this
       * turn" (countered spells were still cast — its ruling).
       */
      readonly countCastBefore?: CardFilter;
      /** Only a spell that shares no creature type with a creature its
       * caster controls or a creature card in their graveyard — Volo, Guide
       * to Monsters. A changeling on either side shares every type (rule
       * 702.73a); a spell with no creature type shares none. */
      readonly sharesNoCreatureType?: boolean;
    }
  | {
      /**
       * An ability was activated — one that uses the stack, so never a mana
       * ability (rule 605.3b): "whenever an ability of **equipped creature**
       * is activated, if it isn't a mana ability" (Illusionist's Bracers,
       * `who: "attached"` — the ability's source is the host, still attached
       * once its costs are paid: a host sacrificed to pay them isn't). The
       * trigger object is the ability on the stack, which a `copy-ability`
       * of `"trigger-ability"` copies.
       *
       * Only a permanent's abilities, for now: "whenever you activate an
       * ability" (Rings of Brighthearth) would also have to see one
       * activated from a hand — cycling's (rule 702.29a), an ability on the
       * stack sourced from the cycled card.
       */
      readonly on: "activates-ability";
      readonly who: "attached";
    }
  | {
      /** *This* spell (the one carrying the ability) was cast — a triggered
       * ability that lives on the card on the stack, not a permanent (cascade,
       * storm — rules 702.85 / 702.40). ROADMAP Phase 8. */
      readonly on: "this-cast";
    }
  | {
      /** "When you cycle this card" (rule 702.29c: "when you discard this
       * card to pay an activation cost of a cycling ability") — Dismantling
       * Wave. It triggers from whatever
       * zone the card ends up in, usually the graveyard, and only for this
       * card, and goes on the stack above the cycling ability — so it
       * resolves before the draw (the rulings). */
      readonly on: "this-cycled";
    }
  /** Escape hatch: match the raw event yourself. */
  | { readonly on: "predicate"; readonly match: (event: GameEvent) => boolean };

export interface TriggeredAbility {
  /**
   * Eminence — this ability functions while its card is in the **command
   * zone**, not only on the battlefield, because its text says so (rule
   * 113.6b; Eminence is an ability word, rule 207.2c, with no rules meaning
   * of its own). Edgar Markov: "whenever you cast another Vampire spell, if
   * Edgar Markov is in the command zone or on the battlefield, …".
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
  /**
   * This ability works while its card is in a **graveyard**, and only there
   * (rule 113.6k: an ability that moves its own object out of a zone —
   * "return this card from your graveyard to the battlefield" — functions
   * only in that zone): Bloodghast's "Landfall — … you may return this card
   * from your graveyard to the battlefield", Spit Flame's "… return this
   * card from your graveyard to your hand".
   *
   * The trigger scan adds such cards from every graveyard, for these
   * abilities alone, and never counts them on the battlefield. Its
   * controller is the card's owner. A card that reached the graveyard in the
   * very event being scanned — it left the battlefield together with the
   * creature whose death fired it — wasn't there to see it (Nether Traitor's
   * ruling). `"source"` in the effect finds the card only if it's the same
   * object when the ability resolves (rule 400.7).
   */
  readonly fromGraveyard?: boolean;
  /**
   * Goes on the stack before its controller's other triggers of the same
   * moment, so it resolves after them. The engine doesn't yet ask a player
   * to order simultaneous triggers (rule 603.3b), so this stands in for the
   * order that's never worse — only evoke's sacrifice trigger sets it, so
   * the creature's own enters abilities resolve first (the evoke rulings).
   */
  readonly stackFirst?: boolean;
  readonly trigger: TriggerSpec;
  /** One ability with two trigger events, "whenever A **and whenever** B"
   * (eerie: "whenever an enchantment you control enters and whenever you
   * fully unlock a Room"), is written as two entries, one per event; this
   * one names the other's index in `triggered`, so they're counted as the
   * one ability they are — Victor, Valgavoth's Seneschal's "if this is the
   * first time this ability has resolved this turn". */
  readonly sameAbilityAs?: number;
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
  /**
   * A condition that is part of the **trigger condition** — "whenever you
   * cast a spell **while Fire Lord Azula is attacking**" (rule 603.1). Checked
   * only as the event happens: unlike an intervening "if" (`condition`, rule
   * 603.4, which only an "if" right after the trigger event is), it isn't
   * asked again as the ability resolves, so Azula leaving combat in response
   * doesn't stop the copy. Evaluated like `condition`, counting the source.
   */
  readonly whileCondition?: StaticCondition;
  /**
   * "This ability triggers only once each turn" (rule 603.2 — Morbid
   * Opportunist, Welcoming Vampire). Once it has triggered this turn, further
   * events don't trigger it, whoever's turn it is. That also makes "whenever
   * one or more …" exact on a per-object trigger: the first of a batch
   * triggers it and the rest can't. Tracked per ability of one object, so a
   * permanent that leaves and returns is a new object that may trigger again.
   */
  readonly oncePerTurn?: boolean;
  /** "N damage divided as you choose among any number of target …"
   * (Dragonlord Atarka, Inferno Titan): the targets from `slot` on — an
   * `any-number` group — share `total`, split as the ability is put on the
   * stack (rule 603.3d: the `choose-targets` answer's `division`, at least 1
   * each) and dealt by a `damage-divided` effect. A target gone illegal loses
   * its share. */
  readonly divided?: { readonly total: number; readonly slot: number };
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
    // Mana abilities are battlefield-only here: an ability activated from a
    // hand, graveyard or the command zone always uses the stack.
    ability.zone === undefined &&
    // Rule 605.1a: a cost that moves a card from a library (Millikin's "Mill
    // a card") makes it an ordinary activated ability, on the stack.
    ability.cost.mill === undefined &&
    // Whatever else it costs (605.1a asks of a cost only that it move no
    // card to or from a library): a sacrifice of itself (Treasure) or of a
    // chosen permanent (Kykar's "Sacrifice a Spirit"), life, counters
    // removed (Ramos), energy. Which of those the
    // auto-payer can pay by itself is `Game.manaSources`' business; the
    // rest are activated by hand, and still never use the stack.
    ability.targets.length === 0 &&
    ability.resolve === null &&
    ability.effect !== null &&
    // One `add-mana`, or several in a row — Ramos, Dragon Engine's "Add
    // {W}{W}{U}{U}{B}{B}{R}{R}{G}{G}" is five of them.
    addsManaOnly(ability.effect)
  );
}

/** An effect that is nothing but adding mana: one `add-mana`, or several in
 * a row. */
function addsManaOnly(effect: EffectSpec): boolean {
  return (
    effect.kind === "add-mana" ||
    (effect.kind === "sequence" &&
      effect.effects.length > 0 &&
      effect.effects.every((step) => step.kind === "add-mana"))
  );
}

/**
 * Rule 605.1a's own test for an activated mana ability — no target, could add
 * mana, not a loyalty ability — wherever the ability functions from. The
 * difference from {@link isManaAbility} is only that: the engine runs an
 * ability that works from a hand, a graveyard or the command zone on the
 * stack, but a card still *has* such a mana ability (an Elvish Spirit Guide
 * on the battlefield has "Exile this card from your hand: Add {G}"), which is
 * what "a creature with a mana ability" asks.
 */
export function isManaAbilityByRule(ability: ActivatedAbility): boolean {
  return isManaAbility(ability.zone === undefined ? ability : { ...ability, zone: undefined });
}

/**
 * A triggered mana ability (rule 605.1b): one that triggers from a mana
 * ability resolving or mana being added, adds mana, and doesn't target — in
 * the engine, a `tapped-for-mana` trigger (Crypt Ghast's "whenever you tap a
 * Swamp for mana, add an additional {B}"). Raggadragga, Goreguts Boss's
 * ruling counts these as mana abilities. A trigger that merely adds mana on
 * some other event (Lotus Cobra's landfall, Priest of Urabrask entering) uses
 * the stack and isn't one.
 */
export function isTriggeredManaAbility(ability: TriggeredAbility): boolean {
  return (
    ability.trigger.on === "tapped-for-mana" &&
    ability.targets.length === 0 &&
    ability.resolve === null &&
    ability.effect !== null &&
    addsManaOnly(ability.effect)
  );
}

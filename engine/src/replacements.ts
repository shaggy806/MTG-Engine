/**
 * Replacement effects — rule 614 / 616. A replacement watches for a particular
 * event and modifies (or cancels) it *before* it happens, rather than reacting
 * after like a triggered ability.
 *
 * Modeled as an optional `replacement` field on a `StaticAbility` (rule 614.1 —
 * a replacement is a kind of static ability), applied by `game.ts`.
 *
 * **Phase 1a** covered only `enters-battlefield` *self*-replacements. **Phase 1b**
 * adds the first *external* replacements — a permanent replacing an event that
 * happens elsewhere:
 *   - `would-create-token` — a token *multiplier* (Doubling Season, Parallel
 *     Lives): "twice that many are created instead".
 *   - `would-add-counter` — a counter *multiplier* (Doubling Season): "twice
 *     that many counters are put on instead".
 *   - `would-be-put-into-graveyard` — graveyard hate (Rest in Peace): "exile it
 *     instead".
 * Fog-style one-shot combat-damage prevention is a turn-scoped `GameState` flag,
 * not a static (rule 614 calls it a replacement, but there's no permanent to
 * hang it on). See ROADMAP.md Phase 1.
 *
 * **Phase 11 EG-6** adds `would-draw` (Notion Thief-lite) and an optional
 * `CardFilter` on `would-be-put-into-graveyard` (Anafenza). One-shot
 * damage-prevention shields (Healing Salve) live on `GameState.preventionShields`
 * rather than here (no permanent to hang them on, like Fog). Still not modeled:
 * multi-replacement ordering, damage *redirection* to a third object (Harm's Way).
 *
 * `others-enter-battlefield` is the external form of the enters-battlefield
 * replacement: how *other* permanents enter (Giada's extra counters, Thalia's
 * "enter tapped", The Wandering Minstrel's "enter untapped").
 */

import type { StaticCondition } from "./cards/define.js";
import type { EffectAmount, EffectSpec } from "./effects.js";
import type { CardFilter } from "./filter.js";

/** A single replacement clause on a `StaticAbility`. Discriminated by `event`. */
export type ReplacementSpec =
  | EntersBattlefieldReplacement
  | OthersEnterReplacement
  | TokenMultiplierReplacement
  | CounterMultiplierReplacement
  | GraveyardExileReplacement
  | DrawRedirectReplacement
  | DamageMultiplierReplacement
  | MillMultiplierReplacement
  | LifeGainReplacement;

/** As the source permanent enters the battlefield (rule 614.1c). A self-
 * replacement — printed on the card, applies only to it. */
export interface EntersBattlefieldReplacement {
  readonly event: "enters-battlefield";
  /** It enters tapped (every "enters the battlefield tapped" land / creature). */
  readonly tapped?: boolean;
  /** It enters tapped *unless* this condition holds when it enters — the
   * "check land" cycle (Rootbound Crag: "enters tapped unless you control a
   * Mountain or a Forest"), and the count-based version (Cinder Glade: "unless
   * you control two or more basic lands"). Evaluated once, as it enters. */
  readonly tappedUnless?: StaticCondition;
  /**
   * It enters tapped unless its controller reveals a card with one of these
   * subtypes from their hand — the Shadows over Innistrad "reveal land" cycle
   * (Port Town: "As this land enters, you may reveal a Plains or Island card
   * from your hand. If you don't, this land enters tapped").
   *
   * Distinct from `tappedUnless`, which is a `StaticCondition` over the
   * *battlefield*; this one reads the hand, which no `StaticCondition` can.
   *
   * The printed card says "you **may** reveal", and this reveals
   * automatically whenever it can. Declining is never better except as
   * hidden-information management, which the engine doesn't model anywhere —
   * a deliberate simplification, recorded in AUTHORING.md §15.
   */
  readonly tappedUnlessRevealFromHand?: readonly string[];
  /** If it ends up entering *untapped*, it deals this much damage to its
   * controller (Rockfall Vale: "When Rockfall Vale enters untapped, it deals
   * 1 damage to you"). */
  readonly painIfUntapped?: number;
  /** A "shock land" (rule 614.13): as it enters, its controller may pay this
   * much life to have it enter untapped; otherwise it enters tapped. Raised
   * as a `pay-life-for-untapped` decision. */
  readonly mayPayLife?: number;
  /** It enters with these counters already on it. `amount: "x"` reads the
   * `{X}` chosen when it was cast (Walking Ballista). */
  readonly counters?: { readonly kind: string; readonly amount: EffectAmount };
  /** It enters transformed — a transforming DFC that says "enters the
   * battlefield transformed" unconditionally (rule 712.10 — ROADMAP Phase
   * 10b). Daybound's conditional "if it's night" is handled by the engine,
   * not this flag. */
  readonly transformed?: boolean;
}

/**
 * How *other* permanents enter (rule 614.1c) — the external counterpart of
 * {@link EntersBattlefieldReplacement}, applied by `Game.moveObject` and the
 * token minter to every permanent entering while this one is on the
 * battlefield:
 *   - "Each other Angel you control enters with an additional +1/+1 counter on
 *     it for each Angel you already control" (Giada, Font of Hope);
 *   - "Creatures and nonbasic lands your opponents control enter tapped"
 *     (Thalia, Heretic Cathar);
 *   - "Lands you control enter untapped" (The Wandering Minstrel, Spelunking).
 *
 * **Never applies to its own source**, "other" printed or not: a permanent's
 * ability that affects a general set of permanents doesn't modify how that
 * permanent itself enters (rule 614.12). Nor does it apply to anything
 * entering *at the same time* as its source, which isn't on the battlefield
 * yet (the Thalia / Minstrel / Metallic Mimic rulings) — the engine's
 * simultaneous-entry batch (`Game.withEnterBatch`) is what says so.
 */
export interface OthersEnterReplacement {
  readonly event: "others-enter-battlefield";
  /** Which entering permanents it applies to, matched against each one as it
   * would exist on the battlefield (rule 614.12) — its computed types, and the
   * player it's entering under — from this permanent's controller's
   * perspective: `controlledBy: "you"` is "you control", `"opponent"` is
   * "your opponents control". */
  readonly filter: CardFilter;
  /** It enters tapped, whatever would otherwise untap it on the way in: a
   * land that "enters tapped unless …" enters tapped even when the condition
   * holds (the Thalia, Heretic Cathar ruling). */
  readonly tapped?: boolean;
  /**
   * It enters untapped — beating every "enters tapped", its own ("this land
   * enters tapped"), another permanent's (`tapped` above) and an effect's
   * ("put it onto the battlefield tapped"). Rule 616.1 lets the entering
   * permanent's controller order the replacements, so they can always apply
   * this one last, and the card only reaches permanents its controller
   * controls; a shock land isn't offered its life payment at all (the
   * Wandering Minstrel and Spelunking rulings).
   */
  readonly untapped?: boolean;
  /**
   * It enters with this many additional counters of `kind`. `amount` is read
   * as it enters, from this permanent's perspective (so `countOf` counts what
   * *its* controller controls), and **never counts the permanent entering, or
   * anything entering alongside it** — Giada's "for each Angel you already
   * control". `"trigger-object"` in an amount names the entering permanent.
   * A `would-add-counter` multiplier (Doubling Season) applies on top, as it
   * does to any enters-with-counters.
   */
  readonly counters?: { readonly kind: string; readonly amount: EffectAmount };
}

/** "If one or more tokens would be created under your control, twice that many
 * are created instead" (Doubling Season, Parallel Lives, Anointed Procession).
 * Applies to tokens whose controller is this permanent's controller. Multiple
 * such replacements multiply (order-independent). */
export interface TokenMultiplierReplacement {
  readonly event: "would-create-token";
  readonly multiplier: number;
}

/** "If one or more counters would be put on a permanent you control, twice that
 * many are put on instead" (Doubling Season). Applies to a permanent whose
 * controller is this permanent's controller. `counterKind` narrows it to one
 * kind (e.g. only `"+1/+1"`); omit for any kind. Multiple such replacements
 * multiply. */
export interface CounterMultiplierReplacement {
  readonly event: "would-add-counter";
  readonly multiplier: number;
  readonly counterKind?: string;
  /** Narrows which of your permanents it applies to — Branching Evolution's
   * "on a **creature** you control" is `{ type: "creature" }`. Matched
   * against the permanent's computed characteristics as the counters are
   * put on it. Omit for any permanent you control. */
  readonly filter?: CardFilter;
}

/** "If a card would be put into a graveyard from anywhere, exile it instead"
 * (Rest in Peace, Leyline of the Void). An external replacement. Applies to
 * real cards only, not tokens (a token would just cease to exist either way).
 * `filter` (ROADMAP Phase 11 EG-6) narrows which cards it catches — omit for
 * "every card" (Rest in Peace); `{ type: "creature", ownedBy: "opponent" }`
 * for Anafenza-style graveyard hate. The filter is evaluated from the
 * replacement source's controller's perspective, against the card's *printed*
 * characteristics (it's off the battlefield by the time it would be put into a
 * graveyard) — except with `from: "battlefield"`, where it's still a
 * permanent and the filter reads its computed characteristics and current
 * controller.
 *
 * `from: "battlefield"` is the **dies-only** form (rule 700.4 — "dies" means
 * put into a graveyard from the battlefield): "If a nontoken creature an
 * opponent controls would die, exile it instead". It doesn't catch a card
 * discarded, milled, or countered, which the unqualified form does. Omit for
 * "from anywhere".
 *
 * Finality counters (rule 122 — "if a permanent with a finality counter on it
 * would be put into a graveyard from the battlefield, exile it instead") and
 * the per-object "if it would leave the battlefield, exile it instead of
 * putting it anywhere else" (`GameObject.exileIfItWouldLeave`) are the same
 * redirect, but belong to the moving object rather than to a static, so
 * they're applied by `moveObject` directly rather than through this spec. */
export interface GraveyardExileReplacement {
  readonly event: "would-be-put-into-graveyard";
  readonly instead: "exile";
  readonly filter?: CardFilter;
  readonly from?: "battlefield";
}

/** "If a player [who] would draw a card, [this permanent's controller] draws a
 * card instead" (Notion Thief-lite — ROADMAP Phase 11 EG-6). Applied in
 * `Game.drawCard`. */
export interface DrawRedirectReplacement {
  readonly event: "would-draw";
  /** Whose draw is replaced, relative to this permanent's controller. */
  readonly who: "opponent" | "you";
  /** The replacement: the source's controller draws instead (Notion Thief —
   * `who: "opponent"`), or that player draws `draws` cards instead ("if you
   * would draw a card, draw two cards instead" — gate it with the static's
   * `condition`). Neither replacement applies again to the draws it makes
   * (rule 614.5). */
  readonly instead: "you-draw" | { readonly draws: number };
}

/**
 * A mill, multiplied (rule 614.1a) — Bruvac the Grandiloquent's "if an
 * opponent would mill one or more cards, they mill twice that many cards
 * instead" (`who: "opponent"`, `multiplier: 2`). `who` is whose mill,
 * relative to this permanent's controller; several multiply together.
 */
export interface MillMultiplierReplacement {
  readonly event: "would-mill";
  readonly who: "opponent" | "you" | "any-player";
  readonly multiplier: number;
}

/**
 * Life about to be gained, changed — Bilbo, Birthday Celebrant's "if you
 * would gain life, you gain that much life plus 1 instead" (`who: "you"`,
 * `plus: 1`), and "your opponents can't gain life" (The Lord of Pain —
 * `who: "opponent"`, `prevent: true`; strictly a prohibition, but it stops
 * the same event, lifelink's included). Every `plus` adds up; one `prevent`
 * wins over all of them.
 */
export interface LifeGainReplacement {
  readonly event: "would-gain-life";
  readonly who: "opponent" | "you" | "any-player";
  readonly plus?: number;
  readonly prevent?: boolean;
}

/**
 * Damage about to be dealt, changed (rule 614.1a) — "if a source would deal
 * damage to a permanent or player, it deals double that damage … instead"
 * (Dictate of the Twin Gods: `multiplier: 2`, any source, any recipient),
 * "if a creature you control that entered this turn would deal damage, it
 * deals twice that much damage instead" (Neriv: `source`), "…it deals that
 * much damage plus 2 instead" (Torbran: `plus`), "…prevent that damage and
 * each opponent mills that many cards" (The Mindskinner: `prevent` + `then`).
 *
 * `source` is a filter on the source of the damage, from this permanent's
 * controller's side (a departed source as it last existed); `to` narrows
 * the recipient: `"opponent"` (an opponent), `"opponent-side"` (an opponent
 * or a permanent an opponent controls), `"you"`, `"self"` (this permanent).
 * Omitted: anyone's damage, to anything.
 *
 * Applied in `Game.dealDamage` in a fixed order — every multiplier, then
 * every `plus`, then the first `prevent` that applies, then prevention
 * shields — where rule 616.1 would let the affected player order them.
 * A `prevent` stops all of it, and `then` is applied as this permanent's
 * controller's effect with `"x"` the damage prevented.
 */
export interface DamageMultiplierReplacement {
  readonly event: "would-deal-damage";
  readonly multiplier?: number;
  readonly plus?: number;
  /** "…would deal an amount of damage **less than ~'s power** …, that
   * source deals damage equal to ~'s power instead" (Ojer Axonil, Deepest
   * Might) — raised to this permanent's power, never lowered. After the
   * multipliers and additions. */
  readonly atLeast?: "this-power";
  /** Only combat (`true`) or only noncombat (`false`) damage. */
  readonly combat?: boolean;
  readonly prevent?: boolean;
  readonly then?: EffectSpec;
  readonly source?: CardFilter;
  readonly to?: "opponent" | "opponent-side" | "you" | "self";
}

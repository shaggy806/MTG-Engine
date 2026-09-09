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
 */

import type { StaticCondition } from "./cards/define.js";
import type { CardFilter } from "./filter.js";

/** A single replacement clause on a `StaticAbility`. Discriminated by `event`. */
export type ReplacementSpec =
  | EntersBattlefieldReplacement
  | TokenMultiplierReplacement
  | CounterMultiplierReplacement
  | GraveyardExileReplacement
  | DrawRedirectReplacement;

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
  readonly counters?: { readonly kind: string; readonly amount: number | "x" };
  /** It enters transformed — a transforming DFC that says "enters the
   * battlefield transformed" unconditionally (rule 712.10 — ROADMAP Phase
   * 10b). Daybound's conditional "if it's night" is handled by the engine,
   * not this flag. */
  readonly transformed?: boolean;
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
}

/** "If a card would be put into a graveyard from anywhere, exile it instead"
 * (Rest in Peace, Leyline of the Void). An external replacement. Applies to
 * real cards only, not tokens (a token would just cease to exist either way).
 * `filter` (ROADMAP Phase 11 EG-6) narrows which cards it catches — omit for
 * "every card" (Rest in Peace); `{ type: "creature", ownedBy: "opponent" }`
 * for Anafenza-style graveyard hate. The filter is evaluated from the
 * replacement source's controller's perspective, against the card's *printed*
 * characteristics (it's off the battlefield by the time it would be put into a
 * graveyard). */
export interface GraveyardExileReplacement {
  readonly event: "would-be-put-into-graveyard";
  readonly instead: "exile";
  readonly filter?: CardFilter;
}

/** "If a player [who] would draw a card, [this permanent's controller] draws a
 * card instead" (Notion Thief-lite — ROADMAP Phase 11 EG-6). Applied in
 * `Game.drawCard`. */
export interface DrawRedirectReplacement {
  readonly event: "would-draw";
  /** Whose draw is replaced, relative to this permanent's controller. */
  readonly who: "opponent";
  /** The replacement: the source's controller draws instead. */
  readonly instead: "you-draw";
}

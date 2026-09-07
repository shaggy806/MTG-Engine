/**
 * Replacement effects — rule 614 / 616. A replacement watches for a particular
 * event and modifies (or cancels) it *before* it happens, rather than reacting
 * after like a triggered ability.
 *
 * Modeled as an optional `replacement` field on a `StaticAbility` (rule 614.1 —
 * a replacement is a kind of static ability), applied by `game.ts`.
 *
 * **Phase 1a** covers only `enters-battlefield` *self*-replacements — a card's
 * own "~ enters the battlefield tapped" / "~ enters with N +1/+1 counters"
 * (rule 614.1c). Later phases add `would-create-token`, `would-die`,
 * `would-be-dealt-damage`, `would-draw`, and *external* (non-self) replacements
 * gated by a `CardFilter`. See ROADMAP.md Phase 1.
 */

import type { EffectAmount } from "./effects.js";

/** A single replacement clause on a `StaticAbility`. Discriminated by `event`. */
export type ReplacementSpec = {
  /** As the source permanent enters the battlefield (rule 614.1c). A self-
   * replacement — printed on the card, applies only to it. */
  readonly event: "enters-battlefield";
  /** It enters tapped (every "enters the battlefield tapped" land / creature). */
  readonly tapped?: boolean;
  /** It enters with these counters already on it. `amount: "x"` reads the
   * `{X}` chosen when it was cast (Walking Ballista). */
  readonly counters?: { readonly kind: string; readonly amount: EffectAmount };
};

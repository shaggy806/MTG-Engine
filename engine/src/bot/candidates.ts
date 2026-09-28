/**
 * `LegalAction` → the concrete `Action`s it stands for.
 *
 * `legalActions()` describes a *shape*: "cast this spell, and here are the
 * legal targets for each of its slots". A searching bot needs the individual
 * fillings, because "Doom Blade the 6/6" and "Doom Blade the 1/1" are the same
 * `LegalAction` and very different moves.
 *
 * The cross-product is capped rather than exhaustive — a spell with three
 * slots over a wide board is a combinatorial trap, and the marginal candidate
 * is almost never the best one. `MAX_TARGET_COMBOS` bounds one action;
 * `EvalBotController` bounds the whole decision.
 */

import type { Action, ConvokePayment, LegalAction } from "../actions.js";
import { convokeProofFor } from "../actions.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { subsetsBetween } from "../decisions/shared/subsets.js";
import { targetCombos } from "../decisions/shared/target-combos.js";
import { fitTargetCount, maxXForTargets } from "../target-count.js";
import type { TargetRef, TargetSpec } from "../target.js";

// Re-exported from its new home: a decision module needs it too, and nothing
// under `decisions/` may import from `bot/`.
export { targetCombos };

type CastSpellLegal = Extract<LegalAction, { kind: "cast-spell" }>;
type ActivateAbilityLegal = Extract<LegalAction, { kind: "activate-ability" }>;

/** Per-action ceiling on target fillings. */
export const MAX_TARGET_COMBOS = 8;


/**
 * The cast-time extras beyond targets. `kicked` / `overload` / `free` / `altCost` are
 * echoed back (the engine enumerates each variant as its own `LegalAction`),
 * while a sacrifice cost is a real choice we settle deterministically.
 */
function castExtras(legal: CastSpellLegal): {
  kicked?: boolean;
  overload?: boolean;
  free?: boolean;
  altCost?: boolean;
  costOption?: number;
  sacrifice?: ObjectId;
  convoke?: ConvokePayment[];
  prototype?: boolean;
} {
  const sacrifice = legal.sacrifice;
  const convoke = legal.convoke;
  return {
    ...(legal.kicked === true ? { kicked: true } : {}),
    ...(legal.prototype === true ? { prototype: true } : {}),
    ...(legal.overload === true ? { overload: true } : {}),
    ...(legal.free === true ? { free: true } : {}),
    ...(legal.altCost === true ? { altCost: true } : {}),
    // Each branch of a choice of additional costs is its own variant, so the
    // chosen one has to be echoed back or the cast is refused.
    ...(legal.costOption !== undefined ? { costOption: legal.costOption } : {}),
    // The last choice rather than the first: `castSpellActions` may only be
    // offering this variant at all because the *most* expendable permanent
    // can pay, and the list is ordered oldest-first.
    ...(sacrifice !== undefined && sacrifice.choices.length > 0
      ? { sacrifice: sacrifice.choices[sacrifice.choices.length - 1] }
      : {}),
    // Tap as many creatures as the generic portion allows. Convoke is only
    // ever offered when it might be *needed* to afford the spell, so paying
    // the maximum is the filling most likely to be legal.
    // An X spell is cast at its largest X (below), which convoking may be
    // what pays for: take the payment the offer proved for it.
    ...(convoke?.xProof !== undefined && legal.xCost !== undefined
      ? (() => {
          const payment = convokeProofFor(convoke, legal.xCost.maxX);
          return payment.length > 0 ? { convoke: payment } : {};
        })()
      : convoke !== undefined && convoke.candidates.length > 0 && convoke.maxGeneric > 0
      ? {
          convoke: convoke.candidates
            .slice(0, convoke.maxGeneric)
            .map((creature): ConvokePayment => ({ creature, pays: "generic" })),
        }
      : {}),
  };
}

/**
 * X at its maximum. Enumerating every X multiplies the search by the mana
 * available and almost always lands on the maximum anyway. A targeted modal
 * spell with X (Clan Defiance) needs it as much as any other: its candidates
 * used to be cast without one. The largest with `targets`, where more
 * targets leave less for X (Fireball).
 */
function xValueOf(legal: CastSpellLegal, targets: readonly (TargetRef | null)[]): { xValue?: number } {
  return legal.xCost !== undefined ? { xValue: maxXForTargets(legal.xCost, legal.targetCount, targets) } : {};
}

function castCandidates(legal: CastSpellLegal, player: PlayerId): Action[] {
  const common = {
    type: "cast-spell" as const,
    player,
    card: legal.card,
    ...(legal.via !== undefined ? { via: legal.via } : {}),
    ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
    ...(legal.face !== undefined ? { face: legal.face } : {}),
    ...castExtras(legal),
  };

  // A targeted modal spell picks its modes at cast time. Every subset of modes
  // *and* every targeting of each is far too wide, so each choice of modes
  // takes each mode's first target — the best, once `aimOffer` has ranked
  // them — and the choices are capped. First, as many modes as allowed (what
  // this used to offer as its only candidate), then each mode alone, then the
  // other combinations: a "choose one" spell used to be tried only in its
  // first mode, and "choose one or more" only as every mode at once, aimed at
  // whatever came first — Clan Defiance, X damage to its own flyer, its own
  // creature and itself, which is why it was the card v2 most often left in
  // hand.
  const modal = legal.castModal;
  if (modal !== undefined) {
    const fillable = modal.modes
      .map((_mode, index) => index)
      .filter((index) => modal.modes[index].targetOptions.every((o) => o.length > 0));
    if (fillable.length < modal.minModes) return [];
    const most = fillable.slice(
      0,
      Math.max(modal.minModes, Math.min(modal.maxModes, fillable.length)),
    );
    const choices = [most];
    const seenModes = new Set([JSON.stringify(most)]);
    for (const modes of subsetsBetween(
      fillable,
      Math.max(1, modal.minModes),
      modal.maxModes,
      MAX_TARGET_COMBOS * 2,
    )) {
      if (choices.length >= MAX_TARGET_COMBOS) break;
      const key = JSON.stringify(modes);
      if (seenModes.has(key)) continue;
      seenModes.add(key);
      choices.push(modes);
    }
    const out: Action[] = [];
    for (const modes of choices) {
      const picked = modes.flatMap(
        (index) =>
          targetCombos(modal.modes[index].targetOptions, 1, modal.modes[index].targetSpecs)[0] ?? [],
      );
      const targets = fitTargets(
        legal,
        picked,
        modes.flatMap((index) => modal.modes[index].targetOptions),
        modes.flatMap((index) => modal.modes[index].targetSpecs),
      );
      if (targets !== null) out.push({ ...common, ...xValueOf(legal, targets), targets, modes });
    }
    return out;
  }

  // A "for each target" cost (Hinata) makes only some fillings affordable:
  // each is fitted into the offered range, and one that can't be is dropped.
  const seen = new Set<string>();
  const out: Action[] = [];
  for (const combo of targetCombos(legal.targetOptions, MAX_TARGET_COMBOS, legal.targetSpecs)) {
    const targets = fitTargets(legal, combo, legal.targetOptions, legal.targetSpecs);
    if (targets === null) continue;
    const key = JSON.stringify(targets);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...common, ...xValueOf(legal, targets), targets });
  }
  return out;
}

function fitTargets(
  legal: CastSpellLegal,
  chosen: readonly (TargetRef | null)[],
  options: readonly (readonly TargetRef[])[],
  specs: readonly TargetSpec[],
): (TargetRef | null)[] | null {
  if (legal.targetCount === undefined) return [...chosen];
  return fitTargetCount(chosen, options, specs, legal.targetCount);
}

function abilityCandidates(legal: ActivateAbilityLegal, player: PlayerId): Action[] {
  const sacrifice = legal.sacrifice;
  const common = {
    type: "activate-ability" as const,
    player,
    source: legal.source,
    abilityIndex: legal.abilityIndex,
    ...(sacrifice !== undefined && sacrifice.choices.length > 0
      ? { sacrifice: sacrifice.choices[sacrifice.choices.length - 1] }
      : {}),
    ...(legal.xCost !== undefined ? { xValue: legal.xCost.maxX } : {}),
  };
  return targetCombos(legal.targetOptions, MAX_TARGET_COMBOS, legal.targetSpecs).map(
    (targets) => ({ ...common, targets }),
  );
}

/**
 * The concrete actions `legal` stands for, for `player`.
 *
 * Only the priority-window kinds are expanded. Combat declarations are
 * deliberately excluded: attacker subsets are `(defenders + 1) ^ creatures`,
 * which a ten-creature board turns into roughly a million, so those stay
 * constructive (`HeuristicBotController.declareAttackers`) and are never
 * enumerated.
 */
export function candidateActions(
  legal: LegalAction,
  player: PlayerId,
): Action[] {
  switch (legal.kind) {
    case "play-land":
      return [
        {
          type: "play-land",
          player,
          card: legal.card,
          ...(legal.face !== undefined ? { face: legal.face } : {}),
          ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
        },
      ];
    case "cast-spell":
      return castCandidates(legal, player);
    case "activate-ability":
      return abilityCandidates(legal, player);
    case "suspend":
      return [{ type: "suspend", player, card: legal.card }];
    case "foretell":
      return [{ type: "foretell", player, card: legal.card }];
    case "cycle":
      return [{ type: "cycle", player, card: legal.card }];
    default:
      return [];
  }
}

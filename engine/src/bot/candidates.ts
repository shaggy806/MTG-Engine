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
import type { ObjectId, PlayerId } from "../primitives.js";
import { isOptionalSpec } from "../target.js";
import type { TargetRef, TargetSpec } from "../target.js";

type CastSpellLegal = Extract<LegalAction, { kind: "cast-spell" }>;
type ActivateAbilityLegal = Extract<LegalAction, { kind: "activate-ability" }>;

/** Per-action ceiling on target fillings. */
export const MAX_TARGET_COMBOS = 8;

/**
 * Every combination of one target per slot, breadth-first so the caps bite on
 * the later slots rather than starving the first one, and capped at `limit`.
 * A slot with no legal target yields nothing — the action isn't playable.
 */
export function targetCombos(
  optionLists: readonly (readonly TargetRef[])[],
  limit: number,
  specs: readonly TargetSpec[] = [],
): (TargetRef | null)[][] {
  if (optionLists.length === 0) return [[]];
  // A required slot with nothing to point at means the action isn't playable.
  // An optional one ("up to one target creature") just gets skipped.
  if (optionLists.some((options, i) => options.length === 0 && !isOptionalSpec(specs[i]))) {
    return [];
  }
  let combos: (TargetRef | null)[][] = [[]];
  optionLists.forEach((options, i) => {
    // Skipping is a real choice for an optional slot, so offer it alongside
    // the targets rather than only when there's nothing to point at.
    const choices: (TargetRef | null)[] = isOptionalSpec(specs[i])
      ? [...options, null]
      : [...options];
    const next: (TargetRef | null)[][] = [];
    for (const combo of combos) {
      for (const choice of choices) {
        if (next.length >= limit) break;
        next.push([...combo, choice]);
      }
      if (next.length >= limit) break;
    }
    combos = next;
  });
  return combos;
}

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
  sacrifice?: ObjectId;
  convoke?: ConvokePayment[];
} {
  const sacrifice = legal.sacrifice;
  const convoke = legal.convoke;
  return {
    ...(legal.kicked === true ? { kicked: true } : {}),
    ...(legal.overload === true ? { overload: true } : {}),
    ...(legal.free === true ? { free: true } : {}),
    ...(legal.altCost === true ? { altCost: true } : {}),
    // The last choice rather than the first: `castSpellActions` may only be
    // offering this variant at all because the *most* expendable permanent
    // can pay, and the list is ordered oldest-first.
    ...(sacrifice !== undefined && sacrifice.choices.length > 0
      ? { sacrifice: sacrifice.choices[sacrifice.choices.length - 1] }
      : {}),
    // Tap as many creatures as the generic portion allows. Convoke is only
    // ever offered when it might be *needed* to afford the spell, so paying
    // the maximum is the filling most likely to be legal.
    ...(convoke !== undefined && convoke.candidates.length > 0 && convoke.maxGeneric > 0
      ? {
          convoke: convoke.candidates
            .slice(0, convoke.maxGeneric)
            .map((creature): ConvokePayment => ({ creature, pays: "generic" })),
        }
      : {}),
  };
}

function castCandidates(legal: CastSpellLegal, player: PlayerId): Action[] {
  const common = {
    type: "cast-spell" as const,
    player,
    card: legal.card,
    ...(legal.via !== undefined ? { via: legal.via } : {}),
    ...(legal.face !== undefined ? { face: legal.face } : {}),
    ...castExtras(legal),
  };

  // A targeted modal spell picks its modes at cast time. Enumerating every
  // subset of modes *and* every targeting of each is far too wide, so take
  // the fillable modes in order — the same policy the v1 bot uses.
  const modal = legal.castModal;
  if (modal !== undefined) {
    const fillable = modal.modes
      .map((_mode, index) => index)
      .filter((index) => modal.modes[index].targetOptions.every((o) => o.length > 0));
    if (fillable.length < modal.minModes) return [];
    const modes = fillable.slice(
      0,
      Math.max(modal.minModes, Math.min(modal.maxModes, fillable.length)),
    );
    const targets = modes.flatMap(
      (index) =>
        targetCombos(modal.modes[index].targetOptions, 1, modal.modes[index].targetSpecs)[0] ?? [],
    );
    return [{ ...common, targets, modes }];
  }

  // X is taken at its maximum. Enumerating every X multiplies the search by
  // the mana available and almost always lands on the maximum anyway.
  const xValue = legal.xCost !== undefined ? { xValue: legal.xCost.maxX } : {};
  return targetCombos(legal.targetOptions, MAX_TARGET_COMBOS, legal.targetSpecs).map(
    (targets) => ({ ...common, ...xValue, targets }),
  );
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

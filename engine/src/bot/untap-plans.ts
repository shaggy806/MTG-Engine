/**
 * Plans that turn an untap ability into one more mana: tap one of our lands
 * for mana, untap it with the ability (Kiora, Behemoth Beckoner's "−1: Untap
 * target permanent"), let that resolve with the mana still in the pool (rule
 * 106.4: it empties only as the step ends), then cast a spell the extra mana
 * pays for.
 *
 * The search looks one action deep and never taps for mana on its own
 * (casting auto-pays), so this line was invisible to it: the untap alone
 * scores as loyalty spent for nothing. A live capture (2026-10-06, "alice,
 * turn 18"): four lands, Kiora on the battlefield, Ganax, Astral Hunter
 * ({4}{R}) in hand, and v2 cast Temur Ascendancy. A plan here is found by
 * playing the first two steps on a throwaway copy and asking which spells
 * the engine offers then that it doesn't now; `simulatePlan` scores the
 * whole line, and `EvalBotController` plays it out one step at a time.
 */

import type { Action, LegalAction } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { candidateActions } from "./candidates.js";

type CastSpellLegal = Extract<LegalAction, { kind: "cast-spell" }>;
type ActivateAbilityLegal = Extract<LegalAction, { kind: "activate-ability" }>;

/** One plan: the mana tap, the untap aimed at the tapped land, and the spell
 * the extra mana casts — the offer as the copy saw it once the untap had
 * resolved. */
export interface UntapPlan {
  readonly tap: Action;
  readonly untap: Action;
  readonly cast: CastSpellLegal;
}

/** At most this many lands tried per untap ability, and this many plans
 * kept: each costs a copy and a rollout. */
const MAX_LANDS = 2;
const MAX_PLANS = 3;

/** Whether `effect` untaps its first target slot — on its own or in a
 * sequence. */
function untapsFirstTarget(effect: EffectSpec | null | undefined): boolean {
  if (effect === null || effect === undefined) return false;
  if (effect.kind === "untap") return effect.target === 0;
  if (effect.kind === "sequence") return effect.effects.some(untapsFirstTarget);
  return false;
}

/**
 * Pass priority round until the stack is empty and `me` holds priority again
 * in the same step, nothing waiting on anyone — every opponent passes, as
 * the priority search's rollouts assume. `false` if it gets anywhere else.
 */
export function resolveToPriority(game: Game, me: PlayerId): boolean {
  const { number, step } = game.state.turn;
  for (let i = 0; i < 64; i += 1) {
    const s = game.state;
    if (s.awaiting !== null || s.turn.number !== number || s.turn.step !== step) return false;
    if (s.zones.shared.stack.length === 0) return s.priority.holder === me;
    const holder = s.priority.holder;
    if (holder === null) return false;
    game.dispatch({ type: "pass-priority", player: holder });
  }
  return false;
}

/**
 * The untap plans open to `me` now, at a priority window with the stack
 * empty in our own main phase: for each untap ability we could activate at
 * one of our untapped lands, each way that land taps for mana, the spells
 * that would be castable once the untap resolves and aren't now.
 */
export function findUntapPlans(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  legal: readonly LegalAction[],
): UntapPlan[] {
  if (state.zones.shared.stack.length > 0 || state.awaiting !== null) return [];
  if (state.turnOrder[state.turn.activePlayerIndex] !== me) return [];
  if (state.turn.step !== "precombat-main" && state.turn.step !== "postcombat-main") return [];
  const castableNow = new Set(
    legal.flatMap((l) => (l.kind === "cast-spell" ? [l.card] : [])),
  );
  const isOurUntappedLand = (id: ObjectId): boolean => {
    const object = state.objects[id];
    if (object === undefined || object.controller !== me || object.tapped || object.zone !== "battlefield") {
      return false;
    }
    return registry.has(object.cardName) && registry.get(object.cardName).types.includes("land");
  };
  const manaTaps = (land: ObjectId): ActivateAbilityLegal[] =>
    legal.filter(
      (l): l is ActivateAbilityLegal =>
        l.kind === "activate-ability" && l.manaAbility === true && l.source === land && l.targetSpecs.length === 0,
    );

  const plans: UntapPlan[] = [];
  for (const offer of legal) {
    if (offer.kind !== "activate-ability" || offer.manaAbility === true) continue;
    const object = state.objects[offer.source];
    if (object === undefined || !registry.has(object.cardName)) continue;
    const ability = registry.get(object.cardName).activated[offer.abilityIndex];
    if (ability === undefined || !untapsFirstTarget(ability.effect)) continue;
    const template = candidateActions(offer, me)[0];
    if (template === undefined || template.type !== "activate-ability") continue;
    const lands = (offer.targetOptions[0] ?? [])
      .flatMap((t) => (t.kind === "object" && isOurUntappedLand(t.object) ? [t.object] : []))
      .slice(0, MAX_LANDS);
    for (const land of lands) {
      for (const manaOffer of manaTaps(land)) {
        const tap: Action = {
          type: "activate-ability",
          player: me,
          source: land,
          abilityIndex: manaOffer.abilityIndex,
          ...(manaOffer.manaColors !== undefined ? { manaColors: manaOffer.manaColors } : {}),
        };
        const untap: Action = { ...template, targets: [{ kind: "object", object: land }] };
        let after: readonly LegalAction[];
        try {
          const copy = Game.fromSnapshot({ ...state, eventLog: [] }, { registry });
          copy.dispatch(tap);
          copy.dispatch(untap);
          if (!resolveToPriority(copy, me) || copy.state.objects[land]?.tapped !== false) continue;
          after = copy.legalActions(me);
        } catch {
          continue;
        }
        for (const l of after) {
          if (l.kind !== "cast-spell" || castableNow.has(l.card)) continue;
          if (plans.some((p) => p.cast.card === l.card)) continue;
          plans.push({ tap, untap, cast: l });
          if (plans.length >= MAX_PLANS) return plans;
        }
      }
    }
  }
  return plans;
}

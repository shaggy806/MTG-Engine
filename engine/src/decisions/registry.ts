/**
 * The decision registry: one module per `AwaitingDecision` kind, and the
 * lookups the engine's dispatch paths use to reach them.
 *
 * **Total.** {@link DECISIONS} is a plain `Record`, so adding an
 * `AwaitingDecision` variant without writing its module fails the build here,
 * at the table, rather than several hundred lines away in whichever if-chain
 * happened to be the fallthrough. That was the whole point of the exercise:
 * before it, the canary was `discard` accidentally being the last arm of two
 * separate chains, and the error was a missing `count` property.
 *
 * Adding a decision kind is now: write `decisions/<kind>.ts`, add it here,
 * add its action to {@link DECISION_ACTIONS} and its offer to
 * {@link DECISION_OFFERS}. The compiler names each one you forget.
 */

import type { Action, LegalAction } from "../actions.js";
import { DECISION_ACTIONS } from "./contract.js";
import type { AnyDecisionModule, DecisionKind, RandomSource } from "./contract.js";
import type { PlayerId } from "../primitives.js";
import type { AwaitingDecision } from "../state.js";
import { payLifeForUntapped } from "./pay-life-for-untapped.js";
import { chooseCopy } from "./choose-copy.js";
import { legendRule } from "./legend-rule.js";
import { chooseText } from "./choose-text.js";
import { proliferate } from "./proliferate.js";
import { chooseCreatureType } from "./choose-creature-type.js";
import { chooseModes } from "./choose-modes.js";
import { chooseFromZone } from "./choose-from-zone.js";
import { sacrifice } from "./sacrifice.js";
import { discard } from "./discard.js";
import { commanderReplacement } from "./commander-replacement.js";
import { mulligan } from "./mulligan.js";
import { assignCombatDamage } from "./assign-combat-damage.js";
import { attackers } from "./attackers.js";
import { blockers } from "./blockers.js";
import { chooseTargets } from "./choose-targets.js";
import { scry } from "./scry.js";

export { defineDecision } from "./define.js";

/** Every decision kind. Total — see the header. */
export const DECISIONS: Record<DecisionKind, AnyDecisionModule> = {
  "pay-life-for-untapped": payLifeForUntapped,
  "choose-copy": chooseCopy,
  "legend-rule": legendRule,
  "choose-text": chooseText,
  proliferate,
  "choose-creature-type": chooseCreatureType,
  "choose-modes": chooseModes,
  "choose-from-zone": chooseFromZone,
  sacrifice,
  discard,
  "commander-replacement": commanderReplacement,
  mulligan,
  "assign-combat-damage": assignCombatDamage,
  attackers,
  blockers,
  "choose-targets": chooseTargets,
  scry,
};

/** The module for `kind`. Total, so this cannot fail. */
export function decisionFor(kind: DecisionKind): AnyDecisionModule {
  return DECISIONS[kind];
}

/**
 * The answer to give when nobody will be asked, or `null` when this kind has
 * no safe default and something has to stop and ask.
 *
 * Only `attackers` answers — see its module. Exists so a driver skipping a
 * seat's windows doesn't have to know which decisions are skippable.
 */
export function autoAnswerFor(
  awaiting: AwaitingDecision,
  player: PlayerId,
  legal: readonly LegalAction[],
): Action | null {
  const { autoAnswer } = DECISIONS[awaiting.kind];
  return autoAnswer === undefined ? null : autoAnswer(awaiting as never, player, legal);
}

/**
 * Whether the pending decision names a card as its source — what
 * `PlayerView.decisionSource` is gated on.
 *
 * Was a second switch over every kind in `state.ts`, which is exactly the
 * kind of per-kind knowledge this registry exists to hold once. Lives here
 * rather than being re-exported from `state.ts` because a decision module
 * imports values from `state.ts`, and the reverse import would close a real
 * ESM cycle.
 */
export function decisionHasSource(awaiting: AwaitingDecision): boolean {
  const { hasSource } = DECISIONS[awaiting.kind];
  return typeof hasSource === "function" ? hasSource(awaiting as never) : hasSource;
}

/** Reverse of {@link DECISION_ACTIONS}: which kind an incoming action answers.
 * Built once, and 1:1 by construction — `tables.test.ts` proves no action is
 * claimed by two kinds. */
const KIND_OF_ACTION = new Map<string, DecisionKind>();
for (const [kind, actions] of Object.entries(DECISION_ACTIONS)) {
  for (const action of actions) KIND_OF_ACTION.set(action, kind as DecisionKind);
}

/** The module that answers `action`, or `undefined` if none is migrated (or
 * the action isn't a decision answer at all — a priority action). */
export function decisionForAction(action: Action): AnyDecisionModule | undefined {
  const kind = KIND_OF_ACTION.get(action.type);
  return kind === undefined ? undefined : DECISIONS[kind];
}

/** The module behind a `LegalAction`'s kind, for the bot's candidate
 * enumeration. `undefined` for the many `LegalAction`s that answer no
 * decision (`cast-spell`, `play-land`, `pass-priority`). */
export function decisionForOffer(legal: LegalAction): AnyDecisionModule | undefined {
  const kind = KIND_OF_ACTION.get(legal.kind);
  return kind === undefined ? undefined : DECISIONS[kind];
}

/**
 * A uniformly-random legal answer to `legal`, or `null` when it is not a
 * decision offer at all (`cast-spell`, `play-land`, `pass-priority` — the
 * priority actions `RandomController` still builds itself).
 *
 * The `as never` is the same erasure `autoAnswerFor` and `decisionHasSource`
 * take, and for the same reason: `DECISIONS[kind]` cannot be known to be the
 * module for *that* kind, so the narrowed `OfferOf<K>` parameter has to be
 * re-widened at the one call site. `registry.test.ts`'s `DECISIONS[k].kind === k`
 * assertion is what makes it sound.
 */
export function randomAnswerFor(
  legal: LegalAction,
  player: PlayerId,
  rng: RandomSource,
): Action | null {
  const module = decisionForOffer(legal);
  if (module?.randomAnswer === undefined) return null;
  return module.randomAnswer(legal as never, player, rng);
}

/**
 * Whether `player` may answer the pending decision.
 *
 * The default is `awaiting.player === player`, and `decisions/mulligan.ts`
 * is the one module that overrides it — that phase is parallel, so every
 * player still in `hands` may act at once.
 *
 * The rule had been written out by hand in three places (`Game.legalActions`,
 * `controller.ts`'s `answerAwaited`, and `server/src/room.ts`'s bot driver),
 * all verbatim-identical. Two are now this function; the third goes when the
 * room stops synthesising its own answers.
 */
export function mayActOn(awaiting: AwaitingDecision, player: PlayerId): boolean {
  const { mayAct } = DECISIONS[awaiting.kind];
  return mayAct === undefined ? awaiting.player === player : mayAct(awaiting as never, player);
}

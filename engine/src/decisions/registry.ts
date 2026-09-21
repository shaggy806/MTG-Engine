/**
 * The decision registry: one module per `AwaitingDecision` kind, and the
 * lookups the five dispatch chains use to reach them.
 *
 * **Partial, on purpose, while the migration runs.** {@link DECISIONS} is a
 * `Partial` record: each of the five chains checks the registry first and
 * falls through to its existing if-chain when a kind has no module yet. That
 * is what lets one kind migrate per commit with the build green throughout.
 * The closing step drops `Partial`, at which point the fallthroughs are dead
 * code and are deleted.
 *
 * Until then the totality guarantee lives in `contract.ts`'s
 * {@link DECISION_ACTIONS}/{@link DECISION_OFFERS}, which are already total —
 * so adding an `AwaitingDecision` variant fails the build at the tables even
 * though the module table would tolerate it.
 */

import type { Action, LegalAction } from "../actions.js";
import { DECISION_ACTIONS } from "./contract.js";
import type { AnyDecisionModule, DecisionKind } from "./contract.js";
import type { PlayerId } from "../primitives.js";
import type { AwaitingDecision } from "../state.js";
import { payLifeForUntapped } from "./pay-life-for-untapped.js";
import { chooseCopy } from "./choose-copy.js";
import { chooseText } from "./choose-text.js";
import { proliferate } from "./proliferate.js";
import { chooseCreatureType } from "./choose-creature-type.js";
import { chooseModes } from "./choose-modes.js";
import { chooseFromZone } from "./choose-from-zone.js";
import { sacrifice } from "./sacrifice.js";
import { discard } from "./discard.js";
import { commanderReplacement } from "./commander-replacement.js";
import { mulligan } from "./mulligan.js";
import { scry } from "./scry.js";

export { defineDecision } from "./define.js";

/** Every migrated decision kind. */
export const DECISIONS: Partial<Record<DecisionKind, AnyDecisionModule>> = {
  "pay-life-for-untapped": payLifeForUntapped,
  "choose-copy": chooseCopy,
  "choose-text": chooseText,
  proliferate,
  "choose-creature-type": chooseCreatureType,
  "choose-modes": chooseModes,
  "choose-from-zone": chooseFromZone,
  sacrifice,
  discard,
  "commander-replacement": commanderReplacement,
  mulligan,
  scry,
};

/** The module for `kind`, or `undefined` while it is still on the legacy
 * chain. */
export function decisionFor(kind: DecisionKind): AnyDecisionModule | undefined {
  return DECISIONS[kind];
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
  const module = DECISIONS[awaiting.kind];
  if (module?.mayAct !== undefined) {
    return module.mayAct(awaiting as never, player);
  }
  return awaiting.player === player;
}

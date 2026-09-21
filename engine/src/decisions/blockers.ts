/**
 * Declaring blockers (rule 509.1).
 *
 * The largest validator in the engine, because block legality comes in two
 * layers. Per pair — may this creature block that attacker? — is
 * `combat/eligibility.ts`'s `whyCannotBlock`. Per *set* — menace counting
 * blockers, Lure asking whether a creature that could have blocked didn't —
 * is `combat/blocking.ts`'s `blockingViolations`, which cannot be answered
 * until the whole declaration is known.
 *
 * The set-level half is checked **against the offer**, built here by
 * {@link blockersOffer} and used by both `legal` and `whyCannot`. That is
 * what makes the validator unable to disagree with what was advertised, and
 * it is what lets the client run the same check with only its view: the
 * offer already carries `menaceAttackers`, `mustBlock` and `eligible`.
 */

import type { Action, BlockerDeclaration, LegalAction } from "../actions.js";
import { blockingViolations } from "../combat/blocking.js";
import {
  creatureDef,
  currentAttackers,
  defendingPlayerOf,
  whyCannotBlock,
} from "../combat/eligibility.js";
import { objHasKeyword, restrictionsOf } from "../characteristics.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { defineDecision } from "./define.js";
import type { DecisionReadCtx } from "./contract.js";

function blockersOffer(
  ctx: DecisionReadCtx,
  player: PlayerId,
): Extract<LegalAction, { kind: "declare-blockers" }> {
  const attacking = currentAttackers(ctx.state).filter((id) => {
    const target = ctx.state.objects[id].attacking;
    return target !== null && defendingPlayerOf(ctx.state, target) === player;
  });
  const eligible = ctx.state.zones.shared.battlefield
    .filter((id) => ctx.state.objects[id].controller === player)
    .map((blocker) => ({
      blocker,
      canBlock: attacking.filter(
        (attacker) => whyCannotBlock(ctx.state, ctx.registry, player, blocker, attacker) === null,
      ),
    }))
    .filter((entry) => entry.canBlock.length > 0);
  const menaceAttackers = attacking.filter((id) =>
    objHasKeyword(ctx.state, ctx.registry, id, "menace"),
  );
  // Attackers this defender's able creatures are *forced* to block (Lure —
  // rule 509.1c); menace ones excluded, since a lone creature isn't "able" to
  // block one and that combination is left unmodeled.
  const mustBlock = attacking.filter(
    (id) =>
      restrictionsOf(ctx.state, ctx.registry, id).has("must-be-blocked") &&
      !objHasKeyword(ctx.state, ctx.registry, id, "menace"),
  );
  return { kind: "declare-blockers", eligible, menaceAttackers, mustBlock };
}

export const blockers = defineDecision({
  kind: "blockers",

  hasSource: false,

  legal: (ctx, _awaiting, player): LegalAction[] => [blockersOffer(ctx, player)],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "declare-blockers") {
      return `${player} is not being asked to declare blockers`;
    }
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "blockers" || awaiting.player !== player) {
      return `${player} is not being asked to declare blockers`;
    }
    const name = (id: ObjectId): string =>
      creatureDef(ctx.state, ctx.registry, id)?.name ?? id;

    const seen = new Set<ObjectId>();
    for (const { blocker, attacker } of action.blocks) {
      if (seen.has(blocker)) return `${name(blocker)} is already blocking`;
      seen.add(blocker);
      const why = whyCannotBlock(ctx.state, ctx.registry, player, blocker, attacker);
      if (why !== null) return why;
    }

    // `[0]` keeps the engine reporting one reason, in the order it always
    // has; the client shows the whole list.
    const violation = blockingViolations(action.blocks, blockersOffer(ctx, player))[0];
    if (violation === undefined) return null;
    return violation.kind === "menace"
      ? `${name(violation.attacker)} has menace and must be blocked by two or more creatures`
      : `${name(violation.blocker)} must block (a "must be blocked" attacker)`;
  },

  apply: (host, action): void => {
    if (action.type !== "declare-blockers") return;
    host.applyBlockerDeclarations(action.player, action.blocks);
  },

  ask: (controller, view, _awaiting, player): Action => ({
    type: "declare-blockers",
    player,
    blocks: controller.declareBlockers(view),
  }),

  // candidates: deliberately absent — like `attackers`, combat is never
  // enumerated as a decision. `RandomController` and `HeuristicBotController`
  // build a `Map<blocker, attacker>` as a *policy* rather than re-deriving
  // the predicate, and re-pointing them at `blockingViolations` would mean
  // rewriting them — which would move every fuzzer seed and every
  // `bot:bench` number for no gain.

  // The policy the comment above describes, moved verbatim: it builds a
  // declaration and then drops what the set-level rules forbid, rather than
  // consulting `blockingViolations`. Deliberate — see that comment.
  randomAnswer: (legal, player, rng): Action => {
    const chosen = new Map<ObjectId, ObjectId>(); // blocker -> attacker
    for (const entry of legal.eligible) {
      // Lure (rule 509.1c): a creature able to block a must-be-blocked
      // attacker must block one of them; otherwise a coin flip.
      const mustOptions = entry.canBlock.filter((a) => legal.mustBlock.includes(a));
      if (mustOptions.length > 0) {
        chosen.set(entry.blocker, mustOptions[rng.pickIndex(mustOptions.length)]);
      } else if (rng.random() < 0.5) {
        chosen.set(entry.blocker, entry.canBlock[rng.pickIndex(entry.canBlock.length)]);
      }
    }
    let blocks: BlockerDeclaration[] = [...chosen].map(([blocker, attacker]) => ({
      blocker,
      attacker,
    }));
    // A menace attacker must be blocked by 0 or 2+ creatures; drop lone blocks
    // (must-be-blocked menace attackers are excluded from `mustBlock`).
    blocks = blocks.filter(
      (b) =>
        !legal.menaceAttackers.includes(b.attacker) ||
        blocks.filter((x) => x.attacker === b.attacker).length >= 2,
    );
    return { type: "declare-blockers", player, blocks };
  },
});

/**
 * The contract every decision kind's module implements, plus the two tables
 * that make the set of kinds total.
 *
 * **What a decision module owns.** Each of the 17 `AwaitingDecision` kinds is
 * answered by the same five steps today, spread across five independent
 * if-chains in four files: project a `LegalAction` (`legalActions`), validate
 * an incoming `Action` (`whyCannot*`), apply it (`dispatch`), ask a controller
 * for one (`answerAwaited`), and enumerate candidates for the bot
 * (`bot/decisions.ts`). A module gathers one kind's five arms into one file.
 *
 * **What it does not own: applying.** `apply` is a one-line call through
 * {@link DecisionHost}, which is `Game.dispatch`'s existing switch transposed
 * into an interface — every one of its decision arms is already a one-line
 * delegate. Not a single `apply*` body moves, so the load-bearing statement
 * orderings inside them (the `attacker-declared` → `attackers-declared` emit
 * order, reveal-before-move in `applyChooseFromZone`, the
 * `deferredCommanderMove` latch) are untouched, and `Game` stays the only
 * writer of `GameState`.
 *
 * **Import direction.** Nothing under `decisions/` may import `game.js`, and
 * anything it needs from `controller.js` must be imported with `import type`
 * — `controller.js` will import the registry as a *value*, so a value import
 * back the other way makes a real ESM cycle whose symptom is
 * `TypeError: undefined is not a function` at module init rather than a build
 * failure. `verbatimModuleSyntax` erases the type-only direction, which is
 * what keeps the pair harmless.
 */

import type { Action, LegalAction } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import type { PlayerId } from "../primitives.js";
import type { AwaitingDecision, GameState } from "../state.js";

/** One of the 17 decisions the rules can stop and ask a player for. */
export type DecisionKind = AwaitingDecision["kind"];

/**
 * Which `Action` type(s) answer each decision kind.
 *
 * Total by construction, and that is the point. Today `discard` has no
 * explicit arm anywhere: it is the **implicit fallthrough** at the end of
 * `legalActions`' awaiting block and of `answerAwaited`, which read
 * `awaiting.count` off whatever is left. That accident is the only thing
 * making the build fail when a new `AwaitingDecision` variant is added — a
 * canary nobody chose. This table is the chosen one, and it fails at the
 * table rather than several hundred lines away.
 *
 * `mulligan` is the one kind answered by two action types: one
 * `AwaitingDecision` carries both halves of the phase, switching on the
 * player's `hand.step`.
 */
export const DECISION_ACTIONS = {
  attackers: ["declare-attackers"],
  blockers: ["declare-blockers"],
  "order-blockers": ["order-blockers"],
  "assign-combat-damage": ["assign-combat-damage"],
  discard: ["discard"],
  "choose-from-zone": ["choose-from-zone"],
  mulligan: ["mulligan", "put-on-bottom"],
  "commander-replacement": ["commander-replacement"],
  "pay-life-for-untapped": ["pay-life-for-untapped"],
  "choose-copy": ["choose-copy"],
  "choose-text": ["choose-text"],
  "choose-creature-type": ["choose-creature-type"],
  "choose-modes": ["choose-modes"],
  "choose-targets": ["choose-targets"],
  sacrifice: ["sacrifice"],
  proliferate: ["proliferate"],
  scry: ["scry"],
} as const satisfies Record<DecisionKind, readonly Action["type"][]>;

/**
 * Which `LegalAction` kind(s) each decision kind offers.
 *
 * Kept separate from {@link DECISION_ACTIONS} rather than derived from it
 * because they are checked against different unions — an `Action`
 * discriminates on `type`, a `LegalAction` on `kind`, and `LegalAction` has
 * kinds (`cast-spell`, `play-land`, `pass-priority`) that answer no decision
 * at all. That the two tables currently hold the same strings is a fact about
 * today's engine, not a rule; `satisfies` checks each against its own union.
 */
export const DECISION_OFFERS = {
  attackers: ["declare-attackers"],
  blockers: ["declare-blockers"],
  "order-blockers": ["order-blockers"],
  "assign-combat-damage": ["assign-combat-damage"],
  discard: ["discard"],
  "choose-from-zone": ["choose-from-zone"],
  mulligan: ["mulligan", "put-on-bottom"],
  "commander-replacement": ["commander-replacement"],
  "pay-life-for-untapped": ["pay-life-for-untapped"],
  "choose-copy": ["choose-copy"],
  "choose-text": ["choose-text"],
  "choose-creature-type": ["choose-creature-type"],
  "choose-modes": ["choose-modes"],
  "choose-targets": ["choose-targets"],
  sacrifice: ["sacrifice"],
  proliferate: ["proliferate"],
  scry: ["scry"],
} as const satisfies Record<DecisionKind, readonly LegalAction["kind"][]>;

/**
 * The read-only slice of the game a decision module may look at.
 *
 * A module must not mutate: `legal()` runs inside the `withComputedCache`
 * region `Game.legalActions` opens, so a write would poison the memoised
 * characteristics with no immediate symptom.
 *
 * **`state` is only shallowly `Readonly`, and that is a measured compromise
 * rather than an oversight.** A deep-readonly mapped type over `GameState`
 * does not compile here: reading `state.objects`, `state.players`,
 * `state.awaiting` or `state.delayedTriggers` through one fails with
 * TS7056 — "the inferred type of this node exceeds the maximum length the
 * compiler will serialize" — so every such read would need a hand-written
 * annotation. It is not the tree's depth but its unions: the same thing
 * happens to a deep-readonly `GameObject` alone, on `modifiers`
 * (a `PtModifier[]` spanning layers 3-7d). Shallow `Readonly` costs nothing,
 * catches the obvious slip (`ctx.state.awaiting = …`), and leaves deep
 * mutation to convention plus `MTG_CACHE_CHECK=1` on the fuzzer, which is
 * what guards the same invariant for `Game`'s own read paths today.
 *
 * Capabilities are added here as modules need them (the creature-type
 * suggestions, the affordable-X ceiling, target validity) rather than by
 * handing modules a `Game`. Anything needing mutable state reaches it
 * through one of these methods, never through `state`.
 */
export interface DecisionReadCtx {
  readonly state: Readonly<GameState>;
  readonly registry: CardRegistry;
}

/**
 * Applying an answer — `Game.dispatch`'s decision arms, transposed.
 *
 * Every method here is already a one-line delegate in `dispatch`, so this
 * interface is a restatement of what exists rather than a new seam. `Game`
 * implements it by binding its own `apply*` methods; nothing else may.
 */
export interface DecisionHost {
  readonly apply: (action: Action) => void;
}

/** One decision kind's whole answer half. */
export interface DecisionModule<K extends DecisionKind = DecisionKind> {
  /** The kind this module answers. Pinned as a literal at every definition
   * site so the registry can assert `DECISIONS[k].kind === k`. */
  readonly kind: K;
  /** Whether `player` may answer right now. Defaults to
   * `awaiting.player === player`; only `mulligan` overrides it, because that
   * phase is parallel and every player still in `hands` may act. */
  readonly mayAct?: (awaiting: Extract<AwaitingDecision, { kind: K }>, player: PlayerId) => boolean;
  /** Whether this decision names a card as its source, for
   * `PlayerView.decisionSource`. A decision the rules raise rather than a
   * card does (declaring blockers) answers `false`. */
  readonly hasSource: boolean;
}

/** A module of unknown kind, as the registry stores them. */
export type AnyDecisionModule = DecisionModule<DecisionKind>;

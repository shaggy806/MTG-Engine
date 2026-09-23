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
 * **What it does not own: the applying itself.** {@link DecisionModule.apply}
 * is a one-line call through {@link DecisionHost}, which is `Game.dispatch`'s
 * existing switch transposed into an interface — every one of its decision
 * arms is already a one-line delegate to an `apply*` method. Not a single
 * `apply*` body moves, so the load-bearing statement orderings inside them
 * (the `attacker-declared` → `attackers-declared` emit order,
 * reveal-before-move in `applyChooseFromZone`, the `deferredCommanderMove`
 * latch, and the difference between `applyScry`'s guarded resume and
 * `applyChooseFromZone`'s bare one) are untouched, and `Game` remains the only
 * writer of `GameState`.
 *
 * **Import direction.** Nothing under `decisions/` may import `game.js`, and
 * anything it needs from `controller.js` must be imported with `import type`
 * — `controller.js` imports the registry as a *value*, so a value import back
 * the other way makes a real ESM cycle whose symptom is
 * `TypeError: undefined is not a function` at module init rather than a build
 * failure. `verbatimModuleSyntax` erases the type-only direction, which is
 * what keeps the pair harmless.
 */

import type {
  Action,
  AttackerDeclaration,
  BlockerDeclaration,
  ChosenTargets,
  LegalAction,
} from "../actions.js";
import type { CardRegistry } from "../cards.js";
import type { ControllerView, PlayerController } from "../controller.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { AwaitingDecision, GameState } from "../state.js";
import type { ResolvedTargets } from "../target.js";
import type { TargetRef, TargetSpec } from "../target.js";

/** One of the 17 decisions the rules can stop and ask a player for. */
export type DecisionKind = AwaitingDecision["kind"];

/** The `AwaitingDecision` variant belonging to kind `K`. */
export type AwaitingOf<K extends DecisionKind> = Extract<AwaitingDecision, { kind: K }>;

/**
 * The `LegalAction` variant(s) kind `K` offers, read off {@link DECISION_OFFERS}.
 *
 * The offer-side counterpart of {@link AwaitingOf}, and it earns its keep on
 * {@link DecisionModule.randomAnswer}: that member is handed an offer and must
 * build an answer from it, so narrowing it here means no module needs a
 * runtime `if (legal.kind !== …)` guard for a case the table already rules
 * out. `mulligan` is the one kind where this stays a union — it offers both
 * `mulligan` and `put-on-bottom` — and its module switches on the two.
 */
export type OfferOf<K extends DecisionKind> = Extract<
  LegalAction,
  { kind: (typeof DECISION_OFFERS)[K][number] }
>;

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
  /**
   * The largest `{X}` `player` could currently pay for an activated
   * ability's cost, or 0 when the cost has no `{X}`.
   *
   * A capability rather than something a module computes, because it runs the
   * mana solver over the live board — it plans a real payment for each
   * candidate X until one fails. `choose-modes` needs it to advertise how
   * large an "you may pay {X}{R}" mode's X may be.
   */
  readonly maxAffordableAbilityX: (player: PlayerId, manaString: string | null) => number;
}

/**
 * Applying an answer: `Game.dispatch`'s decision arms, transposed into an
 * interface.
 *
 * Every member is one of `Game`'s existing `apply*` methods, named
 * identically so the correspondence is greppable, and `Game` satisfies this
 * by binding them. Nothing else implements it. It grows one member per
 * migrated kind rather than arriving complete, so each step's diff shows
 * exactly which apply it started routing.
 */
export interface DecisionHost {
  readonly applyPayLifeForUntapped: (player: PlayerId, pay: boolean) => void;
  readonly applyCopyChoice: (player: PlayerId, copy: ObjectId | null) => void;
  readonly applyTextChoice: (player: PlayerId, from: string, to: string) => void;
  readonly applyProliferate: (player: PlayerId, chosen: readonly TargetRef[]) => void;
  readonly applyCreatureTypeChoice: (player: PlayerId, creatureType: string) => void;
  readonly applyModesChoice: (player: PlayerId, modes: readonly number[], xValue?: number) => void;
  readonly applyChooseFromZone: (player: PlayerId, chosen: readonly ObjectId[]) => void;
  readonly applySacrifice: (player: PlayerId, permanents: readonly ObjectId[]) => void;
  readonly applyDiscard: (player: PlayerId, cards: readonly ObjectId[]) => void;
  readonly applyCommanderChoice: (player: PlayerId, toCommandZone: boolean) => void;
  readonly applyMulligan: (player: PlayerId, keep: boolean) => void;
  readonly applyPutOnBottom: (player: PlayerId, cards: readonly ObjectId[]) => void;
  readonly applyAssignCombatDamage: (player: PlayerId, assignment: readonly number[]) => void;
  readonly applyAttackerDeclarations: (player: PlayerId, declarations: readonly AttackerDeclaration[]) => void;
  readonly applyBlockerDeclarations: (player: PlayerId, blocks: readonly BlockerDeclaration[]) => void;
  readonly applyChooseTargets: (player: PlayerId, targets: ResolvedTargets) => void;
  readonly applyScry: (player: PlayerId, away: readonly ObjectId[]) => void;
}

/**
 * One decision kind's whole answer half.
 *
 * Every member is a *move* of code that exists today, not a new abstraction:
 * `legal` is one arm of `legalActions`' awaiting block, `whyCannot` is one
 * `Game.whyCannot*` body, `apply` is one arm of `dispatch`, `ask` is one arm
 * of `answerAwaited`, `candidates` is one arm of `decisionCandidates`.
 */
export interface DecisionModule<K extends DecisionKind = DecisionKind> {
  /** The kind this module answers. Pinned as a literal at every definition
   * site so the registry can assert `DECISIONS[k].kind === k` — the runtime
   * check standing in for a correlation TypeScript cannot express. */
  readonly kind: K;

  /**
   * Whether this decision names a card as its source, for
   * `PlayerView.decisionSource` — a decision the rules raise rather than a
   * card does (declaring blockers) answers `false`.
   *
   * A predicate rather than a constant for `discard`, the one kind where it
   * genuinely varies: the cleanup-step hand-size trim is the turn's own
   * bookkeeping, while a Mind Rot discard has a card behind it. This used to
   * be a second switch over every kind in `state.ts`; the registry reads it
   * from here now.
   */
  readonly hasSource: boolean | ((awaiting: AwaitingOf<K>) => boolean);

  /** Whether `player` may answer right now. Omitted means the default,
   * `awaiting.player === player`; only `mulligan` overrides it, because that
   * phase is parallel and every player still in `hands` may act. */
  readonly mayAct?: (awaiting: AwaitingOf<K>, player: PlayerId) => boolean;

  /** What `legalActions` offers while this decision is pending. Must be
   * **pure**: it runs inside a `withComputedCache` region. */
  readonly legal: (
    ctx: DecisionReadCtx,
    awaiting: AwaitingOf<K>,
    player: PlayerId,
  ) => LegalAction[];

  /**
   * Why `action` is not a legal answer, or `null`.
   *
   * Takes the whole `Action` rather than a pre-narrowed payload, and owns its
   * own "is not being asked to …" guard, deliberately. That wording is
   * asserted by `seam.test.ts` and `zone-choice.test.ts` on a cross-kind
   * dispatch, and it travels verbatim to the client as the red error banner.
   * Hoisting the guard into the dispatcher would collapse 17 messages into
   * one generic one and break both.
   */
  readonly whyCannot: (ctx: DecisionReadCtx, action: Action, player: PlayerId) => string | null;

  /** Carry the answer out, by calling the matching `apply*` on the host. One
   * line; the body stays on `Game`. */
  readonly apply: (host: DecisionHost, action: Action) => void;

  /** Ask a controller for an answer — one arm of `answerAwaited`. */
  readonly ask: (
    controller: PlayerController,
    view: ControllerView,
    awaiting: AwaitingOf<K>,
    player: PlayerId,
  ) => Action;

  /**
   * The answer to give when nobody is going to be asked — a seat running an
   * auto-pass, a headless driver, anything skipping this decision.
   *
   * Only `attackers` has one: "declare no attackers" is the trivially safe
   * answer, and a seat that has opted out of its own priority windows should
   * not be stopped by the attack step. Every other kind either has no safe
   * default or is a decision the player asked for.
   */
  readonly autoAnswer?: (awaiting: AwaitingOf<K>, player: PlayerId) => Action;

  /**
   * Candidate answers for the searching bots, best-effort and capped.
   *
   * **Absent on purpose for seven kinds**, each of which carries its reason as a
   * comment where the field would be. An empty slot here is a measured
   * finding, not an unfinished TODO — searching `commander-replacement`, for
   * one, made the bot feed its commander to the first removal spell, because
   * `features.ts` has no command-zone term while a graveyard card is worth
   * 0.05.
   *
   * Order is load-bearing: `Game.fromSnapshot` rollouts replay in the order
   * these are emitted, so a reordering shifts every `bot:bench` number and
   * silently re-points the frozen champions in `bot/champions/`.
   */
  readonly candidates?: (
    legal: LegalAction,
    player: PlayerId,
    limit: number,
    helpers: CandidateHelpers,
  ) => Action[];

  /**
   * A uniformly-random legal answer — one arm of `RandomController.toAction`.
   *
   * The fuzzer's arm, not the bot's: {@link candidates} enumerates answers
   * worth *searching*, this one picks a single answer worth *trying*, and
   * several kinds deliberately weight it (a 0.6 coin flip per attacker, a 0.2
   * mulligan cap so a fuzz game can't mulligan forever) rather than sampling
   * uniformly from what is legal. Those weights are tuned for coverage and
   * termination; they are not a policy and nothing plays by them.
   *
   * **Present on all 17 kinds**, unlike `candidates` — a decision the fuzzer
   * cannot answer is a decision it deadlocks on, so there is no judgement call
   * about whether a kind is worth having one.
   *
   * Changing the order or number of `rng` calls in here changes every fuzzer
   * seed's trajectory; see {@link RandomSource}.
   */
  readonly randomAnswer?: (
    legal: OfferOf<K>,
    player: PlayerId,
    rng: RandomSource,
  ) => Action;
}

/**
 * The randomness a {@link DecisionModule.randomAnswer} draws on — the three
 * private helpers `RandomController` used to answer every decision with,
 * handed over as an interface so the arms could move out of it.
 *
 * **Every method here is load-bearing for replay identity.** The fuzzer's
 * same-seed-replays-identically guarantee rests on the exact *sequence* of
 * calls made against one stream, so an arm that draws a number it did not draw
 * before — or draws the same numbers in a different order — silently re-points
 * every seed in `play:random` without failing a test. That is why `pickTargets`
 * is here rather than being re-implemented per module out of `pickIndex`: it
 * skips an optional slot on a `random() < 0.25` roll *before* indexing, and a
 * module that rebuilt it would almost certainly draw in the other order.
 */
export interface RandomSource {
  /** A float in `[0, 1)`. */
  readonly random: () => number;
  /** A uniform index into a list of `length`, clamped so `random()` returning
   * exactly 1 can't run off the end. Draws exactly one number. */
  readonly pickIndex: (length: number) => number;
  /** A random target per slot, a hole for a slot with no options, and an
   * optional slot skipped at random so both branches get fuzzed. */
  readonly pickTargets: (
    options: readonly (readonly TargetRef[])[],
    specs?: readonly TargetSpec[],
  ) => ChosenTargets;
}

/**
 * The two capabilities `bot/decisions.ts` already threads into its candidate
 * enumeration, passed on to a module's {@link DecisionModule.candidates}.
 *
 * Neither can be read off `DecisionReadCtx`: `order` is the *bot's* opinion
 * of which cards are most valuable, and `controllerOf` is resolved against
 * the simulated board a rollout is standing on, not the live one.
 */
export interface CandidateHelpers {
  /** Most valuable first, for where a list is capped: tutors try the best
   * cards first, sacrifices and discards the cheapest. */
  readonly order: (ids: readonly ObjectId[]) => readonly ObjectId[];
  /** Who controls an object; `undefined` when the caller didn't supply it.
   * Only `proliferate` needs it, and without it that branch degrades to
   * "all or nothing", never to a wrong answer. */
  readonly controllerOf: (id: ObjectId) => PlayerId | undefined;
}

/** A module of unknown kind, as the registry stores them. */
export type AnyDecisionModule = DecisionModule<DecisionKind>;

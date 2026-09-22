/**
 * A `PlayerController` supplies the decisions the rules require of a player.
 *
 * `act(view)` is the single entry point: when `view.state.awaiting` is set the
 * controller must return the matching declaration, otherwise it returns any
 * legal priority action. The base classes implement `act` by delegating to the
 * per-decision methods below, so subclasses only override what they care about.
 */

import type {
  Action,
  AttackerDeclaration,
  BlockerDeclaration,
  ChosenTargets,
  ConvokePayment,
  LegalAction,
} from "./actions.js";
import { standardAssignment } from "./combat/damage.js";
import { decisionFor, mayActOn, randomAnswerFor } from "./decisions/registry.js";
import type { RandomSource } from "./decisions/contract.js";
import { computeCharacteristics } from "./characteristics.js";
import { CardRegistry, createDefaultRegistry } from "./cards.js";
import { chooseBottomOfHand, shouldMulligan } from "./bot/mulligan.js";
import { manaValue, parseManaCost } from "./mana.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameObject, GameState } from "./state.js";
import { isOptionalSpec } from "./target.js";
import type { TargetRef, TargetSpec } from "./target.js";

export type { AttackerDeclaration, BlockerDeclaration };

export interface ControllerView {
  readonly state: GameState;
  readonly player: PlayerId;
  /** Everything this player may legally do right now. */
  legalActions(): readonly LegalAction[];
}

export interface PlayerController {
  readonly playerId: PlayerId;
  /** Called whenever this player holds priority. Return an action to take. */
  act(view: ControllerView): Action;
  /** Choose exactly `count` cards from `hand` to discard. */
  chooseDiscards(hand: readonly GameObject[], count: number): readonly ObjectId[];
  /** Declare this player's attackers. */
  declareAttackers(view: ControllerView): readonly AttackerDeclaration[];
  /** Declare this player's blockers. */
  declareBlockers(view: ControllerView): readonly BlockerDeclaration[];
  /**
   * Order the blockers assigned to one attacker for damage assignment
   * (attacking player's choice). Reached via `act` as an `order-blockers`
   * action when `awaiting.kind === "order-blockers"`.
   */
  orderBlockers(
    view: ControllerView,
    attacker: ObjectId,
    blockers: readonly ObjectId[],
  ): readonly ObjectId[];
  /**
   * Assign a blocked attacker's combat damage (rule 510.1c). Return one
   * amount per blocker in `blockers` order; `power − sum` (allowed only with
   * `trample`, and it must be ≥ 0) goes to the defending player / planeswalker.
   * `lethal[i]` is the minimum for each blocker before a later one / the
   * defender may be assigned. Reached via `act` when
   * `awaiting.kind === "assign-combat-damage"`.
   */
  assignCombatDamage(
    view: ControllerView,
    assignment: {
      readonly attacker: ObjectId;
      readonly blockers: readonly ObjectId[];
      readonly power: number;
      readonly lethal: readonly number[];
      readonly trample: boolean;
    },
  ): readonly number[];
  /**
   * Choose one target per spec for a triggered ability being put on the stack.
   * `legalOptions[i]` is the non-empty list of legal targets for `specs[i]`.
   */
  chooseTargets(
    view: ControllerView,
    sourceName: string,
    specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): ChosenTargets;
  /**
   * Choose between `min` and `max` cards from `eligible` (the choosable
   * subset of a `"look-and-choose"` effect's revealed candidates — narrower
   * than everything revealed when the effect restricts the choice, e.g. to
   * a Dragon card) to move to the effect's destination.
   */
  chooseFromZone(
    view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ): readonly ObjectId[];
  /**
   * Whether to take another mulligan (shuffle the current hand back into the
   * library and draw a fresh one) given `count` already taken this game.
   */
  mulligan(view: ControllerView, count: number): boolean;
  /**
   * Choose which `count` cards from `hand` go to the bottom of the library
   * after keeping a mulliganed hand (the London mulligan).
   */
  chooseBottomOfLibrary(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[];
  /**
   * A commander was put into `movedTo` (a hidden zone). Return `true` to move
   * it to the command zone instead, `false` to leave it (rule 903.9a).
   */
  commanderReplacement(
    view: ControllerView,
    commander: ObjectId,
    movedTo: "graveyard" | "exile" | "hand" | "library",
  ): boolean;
  /**
   * A shock land (`source`) just entered tapped — return `true` to pay `life`
   * life to have it enter untapped, `false` to leave it tapped (rule 614.13).
   */
  payLifeForUntapped(view: ControllerView, source: ObjectId, life: number): boolean;
  /**
   * A Clone-style permanent just entered — return which of `options` it copies,
   * or `null` to copy nothing (rule 707).
   */
  chooseCopy(
    view: ControllerView,
    source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null;
  /**
   * A text-changing spell is resolving (Artificial Evolution — layer 3):
   * return `[from, to]` — the creature-type word to replace and its
   * replacement, drawn from `fromOptions` / `toOptions`.
   */
  chooseText(
    view: ControllerView,
    fromOptions: readonly string[],
    toOptions: readonly string[],
  ): readonly [string, string];
  /**
   * A permanent with "as this enters, choose a creature type" just entered
   * (Urza's Incubator — needed-cards P14). Return one of `options`.
   */
  chooseCreatureType(
    view: ControllerView,
    source: ObjectId,
    options: readonly string[],
    /** The chooser's most relevant creature types, most common first — empty
     * for a short fixed menu. See `LegalAction`'s `suggested`. */
    suggested: readonly string[],
  ): string;
  /**
   * A modal spell/ability is resolving (rule 700.2), or a "you may" clause
   * (rule 601.3e). Return the indices of the modes to apply — distinct, and
   * between `minModes` and `maxModes` in count. An empty array declines an
   * optional ("you may") mode.
   */
  chooseModes(
    view: ControllerView,
    minModes: number,
    maxModes: number,
    modeTexts: readonly string[],
  ): readonly number[];
  /**
   * A sacrifice effect (Diabolic Edict) is asking this player to sacrifice
   * exactly `count` of the `eligible` permanents they control.
   */
  chooseSacrifices(
    view: ControllerView,
    eligible: readonly ObjectId[],
    count: number,
  ): readonly ObjectId[];
  /**
   * A scry / surveil: `cards` are the top of the library (in order). Return
   * which to move away — to the bottom (scry) or the graveyard (surveil). The
   * rest stay on top in their current order.
   */
  chooseScry(
    view: ControllerView,
    cards: readonly ObjectId[],
    mode: "scry" | "surveil",
  ): readonly ObjectId[];
  /**
   * Proliferate (rule 701.27): return any subset of `eligible` — permanents
   * and/or players with counters — to give another counter of each kind they
   * already have. The empty subset is a legal answer.
   */
  chooseProliferate(
    view: ControllerView,
    eligible: readonly TargetRef[],
  ): readonly TargetRef[];
}

const passFor = (player: PlayerId): Action => ({
  type: "pass-priority",
  player,
});

const discardFromFront = (
  hand: readonly GameObject[],
  count: number,
): readonly ObjectId[] => hand.slice(0, count).map((object) => object.id);

/**
 * One target per slot, taking the first option. A slot with no options is
 * left as a hole (`null`), which is legal exactly when that slot is optional
 * — "up to one target creature" with nothing to point at. `specs`, when
 * given, is only needed to distinguish "empty because optional" from "empty
 * because the action shouldn't have been offered"; `legalActions` already
 * refuses to offer the latter (rule 601.2c).
 */
const firstOfEach = (
  legalOptions: readonly (readonly TargetRef[])[],
): ChosenTargets => legalOptions.map((options) => options[0] ?? null);

/**
 * The standard combat-damage assignment: lethal down the blocker order, the
 * remainder to the last blocker (or, with trample, over to the defender).
 *
 * Kept under this name because it is on the engine's public seam
 * (`export * from "./controller.js"`). The implementation moved to
 * `combat/damage.ts`, which `Game.autoAssignForAttacker` now shares — the two
 * had byte-identical loops, so a rules fix to either would have disagreed
 * with the other.
 */
export const standardDamageAssignment = standardAssignment;

/**
 * Answer whatever the engine is waiting on, or `null` if it isn't waiting.
 * Shared by every controller so `act` only has to handle priority choices.
 */
function answerAwaited(
  controller: PlayerController,
  view: ControllerView,
): Action | null {
  const awaiting = view.state.awaiting;
  if (awaiting === null) return null;
  const player = controller.playerId;
  // `mayActOn` is single-player for every kind but `mulligan`, whose phase
  // is parallel — this controller may act while it is still in `hands`.
  if (!mayActOn(awaiting, player)) return null;
  return decisionFor(awaiting.kind).ask(controller, view, awaiting as never, player);
}

/** Always passes priority, never attacks or blocks; discards from the front. */
/** The `suggested` creature types on a pending `choose-creature-type` decision,
 * read off the chooser's own legal actions (the only place they exist). */

export class AutomaticController implements PlayerController {
  readonly playerId: PlayerId;

  constructor(playerId: PlayerId) {
    this.playerId = playerId;
  }

  act(view: ControllerView): Action {
    return answerAwaited(this, view) ?? passFor(this.playerId);
  }

  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return discardFromFront(hand, count);
  }

  declareAttackers(_view: ControllerView): readonly AttackerDeclaration[] {
    return [];
  }

  declareBlockers(_view: ControllerView): readonly BlockerDeclaration[] {
    return [];
  }

  orderBlockers(
    _view: ControllerView,
    _attacker: ObjectId,
    blockers: readonly ObjectId[],
  ): readonly ObjectId[] {
    return blockers;
  }

  assignCombatDamage(
    _view: ControllerView,
    a: { readonly power: number; readonly lethal: readonly number[]; readonly trample: boolean },
  ): readonly number[] {
    return standardDamageAssignment(a);
  }

  chooseTargets(
    _view: ControllerView,
    _sourceName: string,
    _specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): ChosenTargets {
    return firstOfEach(legalOptions);
  }

  chooseFromZone(
    _view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    _max: number,
  ): readonly ObjectId[] {
    return eligible.slice(0, min);
  }

  mulligan(_view: ControllerView, _count: number): boolean {
    return false;
  }

  chooseBottomOfLibrary(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return discardFromFront(hand, count);
  }

  commanderReplacement(): boolean {
    // Default to the command zone — matches the pre-choice behavior, so
    // tests that don't care about the decision are unaffected.
    return true;
  }

  payLifeForUntapped(): boolean {
    // Conservative default: never bleed life for an untapped land (declining
    // is always legal). Tests that care override via a ScriptedController.
    return false;
  }

  chooseCopy(
    _view: ControllerView,
    _source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null {
    return options[0] ?? null;
  }

  chooseText(
    _view: ControllerView,
    fromOptions: readonly string[],
    toOptions: readonly string[],
  ): readonly [string, string] {
    return [fromOptions[0], toOptions[0]];
  }

  chooseCreatureType(
    _view: ControllerView,
    _source: ObjectId,
    options: readonly string[],
    suggested: readonly string[],
  ): string {
    // The most common type among your own cards and the board. `options[0]`
    // alone would be "Advisor" out of the alphabetical catalog — which for
    // Crippling Fear means shrinking every one of your own creatures.
    return suggested[0] ?? options[0];
  }

  chooseModes(
    _view: ControllerView,
    minModes: number,
    _maxModes: number,
    _modeTexts: readonly string[],
  ): readonly number[] {
    // The fewest modes allowed, from the front — for "you may" (min 0) that's
    // declining, matching this controller's do-nothing stance.
    return Array.from({ length: minModes }, (_unused, i) => i);
  }

  chooseSacrifices(
    _view: ControllerView,
    eligible: readonly ObjectId[],
    count: number,
  ): readonly ObjectId[] {
    return eligible.slice(0, count);
  }

  chooseScry(
    _view: ControllerView,
    _cards: readonly ObjectId[],
    _mode: "scry" | "surveil",
  ): readonly ObjectId[] {
    // Keep everything on top — the conservative do-nothing choice.
    return [];
  }

  chooseProliferate(
    view: ControllerView,
    eligible: readonly TargetRef[],
  ): readonly TargetRef[] {
    return ownedProliferateTargets(view, eligible);
  }
}

/**
 * The default proliferate answer for every non-scripted controller: everything
 * *you* control, plus yourself.
 *
 * Deliberately never an opponent's permanent. Adding a counter to something
 * you don't control is the move the old proliferate-everything code made for
 * you, and it ranges from pointless (growing their creature) to losing
 * (refilling their planeswalker). Skipping one of your own that happens to
 * carry a bad counter is the remaining imprecision, and it is the safe
 * direction — a searching bot can do better by scoring the subsets.
 */
function ownedProliferateTargets(
  view: ControllerView,
  eligible: readonly TargetRef[],
): readonly TargetRef[] {
  return eligible.filter((target) =>
    target.kind === "player"
      ? target.player === view.player
      : view.state.objects[target.object]?.controller === view.player,
  );
}

/** A queued action, optionally gated on a condition being true. */
export type ScriptEntry =
  | Action
  | { readonly action: Action; readonly when: (view: ControllerView) => boolean };

const entryAction = (entry: ScriptEntry): Action =>
  "action" in entry ? entry.action : entry;

const entryReady = (entry: ScriptEntry, view: ControllerView): boolean =>
  "action" in entry ? entry.when(view) : true;

type AttackChooser = (view: ControllerView) => readonly AttackerDeclaration[];
type BlockChooser = (view: ControllerView) => readonly BlockerDeclaration[];
type OrderChooser = (
  view: ControllerView,
  attacker: ObjectId,
  blockers: readonly ObjectId[],
) => readonly ObjectId[];
type TargetChooser = (
  view: ControllerView,
  sourceName: string,
  specs: readonly TargetSpec[],
  legalOptions: readonly (readonly TargetRef[])[],
) => ChosenTargets;
type ZoneChooser = (
  view: ControllerView,
  eligible: readonly ObjectId[],
  min: number,
  max: number,
) => readonly ObjectId[];
type MulliganChooser = (view: ControllerView, count: number) => boolean;
type BottomChooser = (
  hand: readonly GameObject[],
  count: number,
) => readonly ObjectId[];
type CommanderReplacementChooser = (
  view: ControllerView,
  commander: ObjectId,
  movedTo: "graveyard" | "exile" | "hand" | "library",
) => boolean;
type CopyChooser = (
  view: ControllerView,
  source: ObjectId,
  options: readonly ObjectId[],
) => ObjectId | null;
type TextChooser = (
  view: ControllerView,
  fromOptions: readonly string[],
  toOptions: readonly string[],
) => readonly [string, string];
type CreatureTypeChooser = (
  view: ControllerView,
  source: ObjectId,
  options: readonly string[],
) => string;
type ModesChooser = (
  view: ControllerView,
  minModes: number,
  maxModes: number,
  modeTexts: readonly string[],
) => readonly number[];
type SacrificeChooser = (
  view: ControllerView,
  eligible: readonly ObjectId[],
  count: number,
) => readonly ObjectId[];
type ScryChooser = (
  view: ControllerView,
  cards: readonly ObjectId[],
  mode: "scry" | "surveil",
) => readonly ObjectId[];
type ProliferateChooser = (
  view: ControllerView,
  eligible: readonly TargetRef[],
) => readonly TargetRef[];
type DamageAssigner = (
  view: ControllerView,
  assignment: {
    readonly attacker: ObjectId;
    readonly blockers: readonly ObjectId[];
    readonly power: number;
    readonly lethal: readonly number[];
    readonly trample: boolean;
  },
) => readonly number[];

/**
 * Plays a fixed queue of priority actions (each firing when its `when` guard is
 * true), and delegates the other decisions to assignable callbacks. Useful for
 * tests and scripted demos.
 */
export class ScriptedController implements PlayerController {
  readonly playerId: PlayerId;
  private readonly queue: ScriptEntry[];

  declareAttackersFn: AttackChooser = () => [];
  declareBlockersFn: BlockChooser = () => [];
  orderBlockersFn: OrderChooser = (_view, _attacker, blockers) => blockers;
  assignCombatDamageFn: DamageAssigner = (_view, a) => standardDamageAssignment(a);
  chooseTargetsFn: TargetChooser = (_view, _source, _specs, legalOptions) =>
    firstOfEach(legalOptions);
  chooseFromZoneFn: ZoneChooser = (_view, eligible, min, _max) => eligible.slice(0, min);
  mulliganFn: MulliganChooser = () => false;
  chooseBottomOfLibraryFn: BottomChooser = (hand, count) => discardFromFront(hand, count);
  commanderReplacementFn: CommanderReplacementChooser = () => true;
  payLifeForUntappedFn: (view: ControllerView, source: ObjectId, life: number) => boolean =
    () => false;
  chooseCopyFn: CopyChooser = (_view, _source, options) => options[0] ?? null;
  chooseTextFn: TextChooser = (_view, fromOptions, toOptions) => [
    fromOptions[0],
    toOptions[0],
  ];
  chooseCreatureTypeFn: CreatureTypeChooser = (_view, _source, options) => options[0];
  chooseModesFn: ModesChooser = (_view, minModes) =>
    Array.from({ length: minModes }, (_unused, i) => i);
  chooseSacrificesFn: SacrificeChooser = (_view, eligible, count) => eligible.slice(0, count);
  chooseScryFn: ScryChooser = () => [];

  /** Defaults to the same "everything you control" answer the other
   * controllers give, so a script only overrides it when the test is actually
   * about the choice. */
  chooseProliferateFn: ProliferateChooser = (view, eligible) =>
    ownedProliferateTargets(view, eligible);

  constructor(playerId: PlayerId, script: readonly ScriptEntry[] = []) {
    this.playerId = playerId;
    this.queue = [...script];
  }

  enqueue(...entries: ScriptEntry[]): void {
    this.queue.push(...entries);
  }

  act(view: ControllerView): Action {
    const awaited = answerAwaited(this, view);
    if (awaited !== null) return awaited;

    const next = this.queue[0];
    if (
      next !== undefined &&
      entryAction(next).player === this.playerId &&
      entryReady(next, view)
    ) {
      this.queue.shift();
      return entryAction(next);
    }
    return passFor(this.playerId);
  }

  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return discardFromFront(hand, count);
  }

  declareAttackers(view: ControllerView): readonly AttackerDeclaration[] {
    return this.declareAttackersFn(view);
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    return this.declareBlockersFn(view);
  }

  orderBlockers(
    view: ControllerView,
    attacker: ObjectId,
    blockers: readonly ObjectId[],
  ): readonly ObjectId[] {
    return this.orderBlockersFn(view, attacker, blockers);
  }

  assignCombatDamage(
    view: ControllerView,
    a: {
      readonly attacker: ObjectId;
      readonly blockers: readonly ObjectId[];
      readonly power: number;
      readonly lethal: readonly number[];
      readonly trample: boolean;
    },
  ): readonly number[] {
    return this.assignCombatDamageFn(view, a);
  }

  chooseTargets(
    view: ControllerView,
    sourceName: string,
    specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): ChosenTargets {
    return this.chooseTargetsFn(view, sourceName, specs, legalOptions);
  }

  chooseFromZone(
    view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ): readonly ObjectId[] {
    return this.chooseFromZoneFn(view, eligible, min, max);
  }

  mulligan(view: ControllerView, count: number): boolean {
    return this.mulliganFn(view, count);
  }

  chooseBottomOfLibrary(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return this.chooseBottomOfLibraryFn(hand, count);
  }

  commanderReplacement(
    view: ControllerView,
    commander: ObjectId,
    movedTo: "graveyard" | "exile" | "hand" | "library",
  ): boolean {
    return this.commanderReplacementFn(view, commander, movedTo);
  }

  payLifeForUntapped(view: ControllerView, source: ObjectId, life: number): boolean {
    return this.payLifeForUntappedFn(view, source, life);
  }

  chooseCopy(
    view: ControllerView,
    source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null {
    return this.chooseCopyFn(view, source, options);
  }

  chooseText(
    view: ControllerView,
    fromOptions: readonly string[],
    toOptions: readonly string[],
  ): readonly [string, string] {
    return this.chooseTextFn(view, fromOptions, toOptions);
  }

  chooseCreatureType(
    view: ControllerView,
    source: ObjectId,
    options: readonly string[],
  ): string {
    return this.chooseCreatureTypeFn(view, source, options);
  }

  chooseModes(
    view: ControllerView,
    minModes: number,
    maxModes: number,
    modeTexts: readonly string[],
  ): readonly number[] {
    return this.chooseModesFn(view, minModes, maxModes, modeTexts);
  }

  chooseSacrifices(
    view: ControllerView,
    eligible: readonly ObjectId[],
    count: number,
  ): readonly ObjectId[] {
    return this.chooseSacrificesFn(view, eligible, count);
  }

  chooseScry(
    view: ControllerView,
    cards: readonly ObjectId[],
    mode: "scry" | "surveil",
  ): readonly ObjectId[] {
    return this.chooseScryFn(view, cards, mode);
  }

  chooseProliferate(
    view: ControllerView,
    eligible: readonly TargetRef[],
  ): readonly TargetRef[] {
    return this.chooseProliferateFn(view, eligible);
  }
}

/**
 * The cast-time extras a `cast-spell` `LegalAction` may demand beyond targets:
 * the `kicked` flag (the engine enumerates kicked and unkicked as separate
 * actions, so it's just echoed back) and a choice of which permanent pays an
 * additional sacrifice cost (rule 601.2f — Harrow). needed-cards P8.
 */
function castExtras(
  legal: Extract<LegalAction, { kind: "cast-spell" }>,
  pickIndex: (n: number) => number,
): {
  kicked?: boolean;
  overload?: boolean;
  free?: boolean;
  altCost?: boolean;
  costOption?: number;
  sacrifice?: ObjectId;
  convoke?: ConvokePayment[];
} {
  const sac = legal.sacrifice;
  const convokeInfo = legal.convoke;
  return {
    ...(legal.kicked === true ? { kicked: true } : {}),
    ...(legal.overload === true ? { overload: true } : {}),
    ...(legal.free === true ? { free: true } : {}),
    // Sephara's alternative cost is its own variant too. Dropping the flag
    // turns it into a cast at the printed cost, which the variant was never
    // offered as affordable at.
    ...(legal.altCost === true ? { altCost: true } : {}),
    // A chosen branch of a choice of additional costs. Echoed back like the
    // flags above, and for the same reason: each branch is its own variant,
    // and a cast that names none is refused outright.
    ...(legal.costOption !== undefined ? { costOption: legal.costOption } : {}),
    ...(sac !== undefined && sac.choices.length > 0
      ? { sacrifice: sac.choices[pickIndex(sac.choices.length)] }
      : {}),
    // Echo back the allocation `legalActions` proved castable rather than
    // inventing one. A convoke-only-affordable spell is offered on the
    // strength of that specific allocation, which may pay coloured pips with
    // matching creatures — tapping the same creatures but having them all pay
    // "generic" can leave the cost uncovered, which is correct rules
    // behaviour and used to crash the fuzzer. Colour-aware convoke payment is
    // covered directly by `convoke.test.ts`.
    ...(convokeInfo !== undefined && convokeInfo.proof.length > 0
      ? { convoke: [...convokeInfo.proof] }
      : {}),
  };
}

/**
 * Picks uniformly at random from `legalActions()`. Useful as a filler opponent
 * and as a fuzz test: a random-vs-random game that runs to completion exercises
 * every action path the engine claims is legal.
 */
export class RandomController extends AutomaticController {
  private readonly random: () => number;

  constructor(playerId: PlayerId, random: () => number = Math.random) {
    super(playerId);
    this.random = random;
  }

  act(view: ControllerView): Action {
    const options = view.legalActions();
    if (options.length === 0) return passFor(this.playerId);
    return this.toAction(options[this.pickIndex(options.length)]);
  }

  private pickIndex(length: number): number {
    return Math.min(length - 1, Math.floor(this.random() * length));
  }

  /** A random target per slot, or a hole for a slot with no options (an
   * optional slot with nothing to point at). Also skips an optional slot at
   * random, so the fuzzer exercises both branches. */
  private pickTargets(
    options: readonly (readonly TargetRef[])[],
    specs: readonly TargetSpec[] = [],
  ): ChosenTargets {
    return options.map((choices, i) => {
      if (choices.length === 0) return null;
      if (isOptionalSpec(specs[i] ?? "creature") && this.random() < 0.25) return null;
      return choices[this.pickIndex(choices.length)];
    });
  }

  /**
   * The `RandomSource` the decision modules answer through — this controller's
   * three private helpers, exposed as an interface.
   *
   * Arrow properties rather than bound methods so `this.random` is read at
   * *call* time: the field is assigned in the constructor, after class field
   * initialisers have run.
   */
  private readonly rng: RandomSource = {
    random: () => this.random(),
    pickIndex: (length) => this.pickIndex(length),
    pickTargets: (options, specs) => this.pickTargets(options, specs),
  };

  private toAction(legal: LegalAction): Action {
    const player = this.playerId;
    // Every decision kind answers itself, in `decisions/<kind>.ts`. What is
    // left here is the priority actions, which answer no `AwaitingDecision`
    // and so have no module to live in.
    const answer = randomAnswerFor(legal, player, this.rng);
    if (answer !== null) return answer;
    switch (legal.kind) {
      case "play-land":
        return {
          type: "play-land",
          player,
          card: legal.card,
          ...(legal.face !== undefined ? { face: legal.face } : {}),
        };
      case "suspend":
        return { type: "suspend", player, card: legal.card };
      case "foretell":
        return { type: "foretell", player, card: legal.card };
      case "cycle":
        return { type: "cycle", player, card: legal.card };
      case "cast-spell": {
        // A targeted modal spell (Phase 11 EG-2): pick a random set of modes
        // whose targets are all fillable, then targets for them.
        if (legal.castModal !== undefined) {
          const cm = legal.castModal;
          const castable = cm.modes
            .map((_m, i) => i)
            .filter((i) => cm.modes[i].targetOptions.every((o) => o.length > 0));
          if (castable.length < cm.minModes) return passFor(player);
          const want = cm.minModes + this.pickIndex(Math.min(cm.maxModes, castable.length) - cm.minModes + 1);
          const pool = [...castable];
          const modes: number[] = [];
          for (let i = 0; i < want && pool.length > 0; i += 1) {
            modes.push(pool.splice(this.pickIndex(pool.length), 1)[0]);
          }
          modes.sort((a, b) => a - b);
          const targets = modes.flatMap((i) => this.pickTargets(cm.modes[i].targetOptions));
          return {
            type: "cast-spell",
            player,
            card: legal.card,
            targets,
            modes,
            ...(legal.via !== undefined ? { via: legal.via } : {}),
            ...(legal.face !== undefined ? { face: legal.face } : {}),
            ...castExtras(legal, (n) => this.pickIndex(n)),
          };
        }
        return {
          type: "cast-spell",
          player,
          card: legal.card,
          targets: this.pickTargets(legal.targetOptions, legal.targetSpecs),
          ...(legal.xCost !== undefined
            ? { xValue: this.pickIndex(legal.xCost.maxX + 1) }
            : {}),
          ...(legal.via !== undefined ? { via: legal.via } : {}),
          ...(legal.face !== undefined ? { face: legal.face } : {}),
          ...castExtras(legal, (n) => this.pickIndex(n)),
        };
      }
      case "activate-ability": {
        const sac = legal.sacrifice;
        return {
          type: "activate-ability",
          player,
          source: legal.source,
          abilityIndex: legal.abilityIndex,
          targets: this.pickTargets(legal.targetOptions, legal.targetSpecs),
          ...(sac !== undefined && sac.choices.length > 0
            ? { sacrifice: sac.choices[this.pickIndex(sac.choices.length)] }
            : {}),
          ...(legal.xCost !== undefined
            ? { xValue: this.pickIndex(legal.xCost.maxX + 1) }
            : {}),
        };
      }
      default:
        return passFor(player);
    }
  }
}

type CastSpellLegal = Extract<LegalAction, { kind: "cast-spell" }>;
type PlayLandLegal = Extract<LegalAction, { kind: "play-land" }>;
type ActivateAbilityLegal = Extract<LegalAction, { kind: "activate-ability" }>;
type DeclareAttackersLegal = Extract<LegalAction, { kind: "declare-attackers" }>;
type DeclareBlockersLegal = Extract<LegalAction, { kind: "declare-blockers" }>;

/**
 * A basic heuristic opponent for live rooms (not the random-vs-random
 * fuzzer's `RandomController`): each priority window, plays a land if it
 * can, else casts the highest-mana-value affordable spell, else activates a
 * non-mana ability, else passes — repeated calls to `act` greedily spend a
 * turn's resources with no lookahead. (Mana abilities are deliberately never
 * activated on their own; see `isManaOnlyAbility`.) Attacks with everything that can, aimed at
 * whichever defender has the least life/loyalty; blocks favorable trades
 * first, then chump-blocks against lethal damage. Every other decision
 * (targeting, modes, sacrifice, scry, mulligan, ...) falls back to
 * `AutomaticController`'s existing conservative defaults — deliberately
 * simple, "plays a sensible game" rather than "plays well". See the "basic
 * bots" plan and `heuristic-bot.test.ts` for known limitations (no combat
 * math beyond power/toughness, no block prediction before attacking).
 */
/** How many times `HeuristicBotController` will activate one ability of one
 * permanent in a single turn. A backstop, not a strategy: an ability with no
 * real cost (Equip {0}) can otherwise be activated forever, and a bot that
 * never passes priority hangs the game it's in. */
const MAX_ACTIVATIONS_PER_TURN = 4;

export class HeuristicBotController extends AutomaticController {
  private readonly registry: CardRegistry;
  /** `source:abilityIndex` -> activations so far, for `activationTurn`. */
  private activations = new Map<string, number>();
  private activationTurn = -1;

  constructor(playerId: PlayerId, registry: CardRegistry = createDefaultRegistry()) {
    super(playerId);
    this.registry = registry;
  }

  private manaValueOf(cardName: string): number {
    if (!this.registry.has(cardName)) return 0;
    return manaValue(parseManaCost(this.registry.get(cardName).manaCost));
  }

  /** Every colour this card can tap for, read off its printed mana abilities
   * (a dual reports both). Empty for a land that makes only colourless. */
  private colorsProducedBy(cardName: string): readonly Color[] {
    if (!this.registry.has(cardName)) return [];
    const out: Color[] = [];
    for (const ability of this.registry.get(cardName).activated) {
      const effect = ability.effect;
      if (effect === null || effect.kind !== "add-mana") continue;
      const mana = effect.mana;
      if (typeof mana === "string") {
        if (mana === "any-color") return ["W", "U", "B", "R", "G"];
        if (mana !== "C" && mana !== "chosen") out.push(mana as Color);
      } else if ("oneOf" in mana) {
        for (const m of mana.oneOf) if (m !== "C") out.push(m as Color);
      }
    }
    return out;
  }

  /**
   * Which land to play when several are legal.
   *
   * This used to be `options.find(...)` — the first land the enumeration
   * happened to list — which is how a Selesnya deck holding two Plains and a
   * Forest lays both Plains and then cannot cast its own {G}{W} commander on
   * turn two. Nothing downstream rescues it either: v2 scores each land drop
   * by simulating it, but the evaluation has no notion of *colour
   * availability*, so every land scores alike and the tie-break picks the
   * first again.
   *
   * So the choice is made here, on the one thing that actually distinguishes
   * them: how many coloured pips in hand a land unlocks that no land already
   * on the battlefield can pay. Ties keep enumeration order, which keeps the
   * bot deterministic.
   */
  private bestLand(state: GameState, lands: readonly PlayLandLegal[]): PlayLandLegal {
    if (lands.length === 1) return lands[0];
    const me = this.playerId;

    const have = new Set<Color>();
    for (const id of state.zones.shared.battlefield) {
      const object = state.objects[id];
      if (object === undefined || object.controller !== me) continue;
      for (const c of this.colorsProducedBy(object.cardName)) have.add(c);
    }

    // What the hand is actually asking for, pip by pip — a card wanting
    // {G}{G} counts green twice, so a second source of it still reads as
    // wanted.
    const want = new Map<Color, number>();
    for (const id of state.zones.perPlayer[me].hand) {
      const object = state.objects[id];
      if (object === undefined || !this.registry.has(object.cardName)) continue;
      const cost = this.registry.get(object.cardName).manaCost;
      if (cost === null) continue;
      for (const [color, n] of Object.entries(parseManaCost(cost).colored)) {
        if (n > 0) want.set(color as Color, (want.get(color as Color) ?? 0) + n);
      }
    }

    let best = lands[0];
    let bestScore = -1;
    for (const land of lands) {
      let score = 0;
      for (const color of new Set(this.colorsProducedBy(land.cardName))) {
        const wanted = want.get(color) ?? 0;
        if (wanted === 0) continue;
        // A colour already covered is worth far less than a new one, but not
        // nothing — a second source still helps cast {G}{G}.
        score += have.has(color) ? wanted : wanted * 10 + 100;
      }
      if (score > bestScore) {
        bestScore = score;
        best = land;
      }
    }
    return best;
  }

  private toPlayLand(legal: PlayLandLegal): Action {
    return {
      type: "play-land",
      player: this.playerId,
      card: legal.card,
      ...(legal.face !== undefined ? { face: legal.face } : {}),
    };
  }

  private toCastSpell(legal: CastSpellLegal): Action {
    const player = this.playerId;
    // Deterministic "pick the last option" policy for sacrifice/convoke
    // choices — for convoke specifically this maximizes creatures tapped,
    // which is the payment this variant of the LegalAction may depend on
    // being affordable at all (see castSpellActions's convoke fallback).
    const pickLast = (n: number) => Math.max(0, n - 1);
    if (legal.castModal !== undefined) {
      const cm = legal.castModal;
      const fillable = cm.modes
        .map((_mode, i) => i)
        .filter((i) => cm.modes[i].targetOptions.every((options) => options.length > 0));
      if (fillable.length < cm.minModes) return passFor(player);
      const modes = fillable.slice(0, Math.max(cm.minModes, Math.min(cm.maxModes, fillable.length)));
      const targets = modes.flatMap((i) => firstOfEach(cm.modes[i].targetOptions));
      return {
        type: "cast-spell",
        player,
        card: legal.card,
        targets,
        modes,
        ...(legal.via !== undefined ? { via: legal.via } : {}),
        ...(legal.face !== undefined ? { face: legal.face } : {}),
        ...castExtras(legal, pickLast),
      };
    }
    return {
      type: "cast-spell",
      player,
      card: legal.card,
      targets: firstOfEach(legal.targetOptions),
      ...(legal.xCost !== undefined ? { xValue: legal.xCost.maxX } : {}),
      ...(legal.via !== undefined ? { via: legal.via } : {}),
      ...(legal.face !== undefined ? { face: legal.face } : {}),
      ...castExtras(legal, pickLast),
    };
  }

  /**
   * Is this option just "tap something for mana"? Casting auto-pays (see
   * `Game.payMana`), so floating mana ahead of a spell gains this bot
   * nothing and actively costs it: the pool empties at the end of the step,
   * and the source it tapped is no longer available to pay for anything
   * else. It also reads as a move to anyone watching — a land flipping
   * sideways for no reason, between a spell being cast and that spell
   * resolving — which is worse than useless once bot moves are paced out one
   * at a time (see `server/src/room.ts`).
   *
   * Read off the legal action rather than the source's printed abilities:
   * only `Game` can resolve a *granted* one, and those can be most of a
   * board — Citanul Hierophants gives every creature "{T}: Add {G}".
   */
  protected isManaOnlyAbility(legal: ActivateAbilityLegal): boolean {
    return legal.manaAbility === true;
  }

  /**
   * Equipment that's already on one of this bot's creatures: moving it to
   * another gains nothing this policy can see, and with Equip {0} (Lightning
   * Greaves) it's free, so the bot shuffled it between two creatures forever
   * and the game never left that main phase.
   */
  private isPointlessReattach(state: GameState, legal: ActivateAbilityLegal): boolean {
    if (!this.registry.has(legal.cardName)) return false;
    const ability = this.registry.get(legal.cardName).activated?.[legal.abilityIndex];
    if (ability?.effect?.kind !== "attach") return false;
    const on = state.objects[legal.source]?.attachedTo;
    return on !== null && on !== undefined;
  }

  private toActivateAbility(legal: ActivateAbilityLegal): Action {
    const player = this.playerId;
    const sac = legal.sacrifice;
    return {
      type: "activate-ability",
      player,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: firstOfEach(legal.targetOptions),
      ...(sac !== undefined && sac.choices.length > 0
        ? { sacrifice: sac.choices[sac.choices.length - 1] }
        : {}),
      ...(legal.xCost !== undefined ? { xValue: legal.xCost.maxX } : {}),
    };
  }

  /**
   * Take as much as the choice allows, rather than `AutomaticController`'s
   * conservative minimum. Every decision that reaches here is an upside the
   * bot has usually just paid for — a library search, a graveyard
   * recursion, a "look at the top N and take some" — and taking the minimum
   * means cracking an Evolving Wilds and then declining to find the land.
   * (Giving cards up is never routed through here: discarding, putting cards
   * on the bottom and sacrificing are all their own decisions.)
   */
  chooseFromZone(
    _view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ): readonly ObjectId[] {
    return eligible.slice(0, Math.max(min, Math.min(max, eligible.length)));
  }

  /**
   * Keep or throw back the opening hand — see `bot/mulligan.ts` for the policy
   * and, in particular, for how it decides that going down a card is worth it.
   * `AutomaticController` keeps everything, including a one-lander.
   */
  mulligan(view: ControllerView, count: number): boolean {
    const hand = view.state.zones.perPlayer[this.playerId].hand.map(
      (id) => view.state.objects[id],
    );
    return shouldMulligan(hand, this.registry, count, view.state.rules);
  }

  /** Surplus lands, then the most expensive spells — see `chooseBottomOfHand`. */
  chooseBottomOfLibrary(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return chooseBottomOfHand(hand, this.registry, count);
  }

  act(view: ControllerView): Action {
    const awaited = answerAwaited(this, view);
    if (awaited !== null) return awaited;

    const player = this.playerId;
    const options = view.legalActions();

    const lands = options.filter((o): o is PlayLandLegal => o.kind === "play-land");
    if (lands.length > 0) return this.toPlayLand(this.bestLand(view.state, lands));

    const spells = options.filter((o): o is CastSpellLegal => o.kind === "cast-spell");
    if (spells.length > 0) {
      const best = spells.reduce((a, b) =>
        this.manaValueOf(b.cardName) > this.manaValueOf(a.cardName) ? b : a,
      );
      return this.toCastSpell(best);
    }

    if (view.state.turn.number !== this.activationTurn) {
      this.activationTurn = view.state.turn.number;
      this.activations.clear();
    }
    const ability = options.find(
      (o): o is ActivateAbilityLegal =>
        o.kind === "activate-ability" &&
        !this.isManaOnlyAbility(o) &&
        !this.isPointlessReattach(view.state, o) &&
        (this.activations.get(`${o.source}:${o.abilityIndex}`) ?? 0) < MAX_ACTIVATIONS_PER_TURN,
    );
    if (ability !== undefined) {
      const key = `${ability.source}:${ability.abilityIndex}`;
      this.activations.set(key, (this.activations.get(key) ?? 0) + 1);
      return this.toActivateAbility(ability);
    }

    return passFor(player);
  }

  /** The value (life, or a planeswalker's loyalty) of attacking `defender`
   * down to zero — used to aim attacks at whoever's closest to losing. */
  private defenderValue(state: GameState, defender: PlayerId | ObjectId): number {
    const asPlayer = state.players[defender as PlayerId];
    if (asPlayer !== undefined) return asPlayer.life;
    return state.objects[defender as ObjectId]?.counters.loyalty ?? 0;
  }

  declareAttackers(view: ControllerView): readonly AttackerDeclaration[] {
    const legal = view
      .legalActions()
      .find((o): o is DeclareAttackersLegal => o.kind === "declare-attackers");
    if (legal === undefined || legal.defenders.length === 0) return [];
    const state = view.state;
    const byValue = (a: PlayerId | ObjectId, b: PlayerId | ObjectId) =>
      this.defenderValue(state, a) - this.defenderValue(state, b);
    // Each attacker picks from its *own* legal defenders: a goaded creature
    // must attack someone other than its goader when it can (rule 701.38b),
    // and a creature under Vow of Duty can't attack the Vow's controller.
    // One shared target for everyone is rejected by `dispatch` the moment
    // either applies.
    return legal.eligible
      .filter((id) => computeCharacteristics(state, this.registry, id).power > 0)
      .flatMap((attacker) => {
        const options = [...(legal.defendersFor[attacker] ?? [])].sort(byValue);
        if (options.length === 0) return [];
        // Prefer a defender who can't eat this creature for free. Sorting on
        // life alone sent a 2/2 commander headlong into an untapped 6/4 while
        // an opponent with an empty board sat next to it — reported from a
        // real game. Life still breaks ties, so the old behaviour survives
        // wherever nobody can punish the attack.
        const safe = options.filter((d) => !this.wouldDieAttacking(state, attacker, d));
        if (safe.length > 0) return [{ attacker, defender: safe[0] }];
        // Everyone can kill it. Attacking anyway just hands over a creature,
        // so this one stays home — v1 used to swing regardless.
        return [];
      });
  }

  /**
   * Would `attacker` die if it attacked `defender`, assuming the defender
   * blocks with whatever kills it?
   *
   * Deliberately crude — it asks only whether *some* untapped creature the
   * defending player controls can deal lethal damage to the attacker, and
   * ignores evasion, multi-blocks and trades the defender might not want.
   * v2's `combat-math.ts` does the real arithmetic; this exists so that v1,
   * which is also v2's fallback and the first candidate v2 scores, stops
   * making the obviously losing attack.
   */
  private wouldDieAttacking(
    state: GameState,
    attacker: ObjectId,
    defender: PlayerId | ObjectId,
  ): boolean {
    const me = computeCharacteristics(state, this.registry, attacker);
    // A planeswalker doesn't block; its controller's creatures do.
    const defendingPlayer =
      state.players[defender as PlayerId] !== undefined
        ? (defender as PlayerId)
        : state.objects[defender as ObjectId]?.controller;
    if (defendingPlayer === undefined) return false;
    return state.zones.shared.battlefield.some((id) => {
      const object = state.objects[id];
      if (object === undefined || object.controller !== defendingPlayer || object.tapped) {
        return false;
      }
      const it = computeCharacteristics(state, this.registry, id);
      if (!it.types.includes("creature")) return false;
      if (it.restrictions.has("cant-block")) return false;
      return it.power >= me.toughness || it.keywords.has("deathtouch");
    });
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    const legal = view
      .legalActions()
      .find((o): o is DeclareBlockersLegal => o.kind === "declare-blockers");
    if (legal === undefined) return [];
    const state = view.state;
    const power = (id: ObjectId) => computeCharacteristics(state, this.registry, id).power;
    const toughness = (id: ObjectId) => computeCharacteristics(state, this.registry, id).toughness;

    const chosen = new Map<ObjectId, ObjectId>(); // blocker -> attacker
    const used = new Set<ObjectId>();

    // Lure (rule 509.1c): a creature able to block a must-be-blocked
    // attacker must block one of them.
    for (const entry of legal.eligible) {
      const mustOptions = entry.canBlock.filter((a) => legal.mustBlock.includes(a));
      if (mustOptions.length > 0) {
        chosen.set(entry.blocker, mustOptions[0]);
        used.add(entry.blocker);
      }
    }

    // A favorable trade: this blocker kills the attacker and survives.
    // Doesn't account for deathtouch/first strike — a simplification, not
    // a correctness bug (the engine still resolves the real combat math).
    for (const entry of legal.eligible) {
      if (used.has(entry.blocker)) continue;
      const favorable = entry.canBlock.find(
        (a) => power(entry.blocker) >= toughness(a) && toughness(entry.blocker) > power(a),
      );
      if (favorable !== undefined) {
        chosen.set(entry.blocker, favorable);
        used.add(entry.blocker);
      }
    }

    // Chump-block the biggest remaining unblocked attackers if the
    // unblocked damage left over would be lethal (or close to it).
    const blockedAttackers = new Set(chosen.values());
    const unblocked = [...new Set(legal.eligible.flatMap((e) => e.canBlock))]
      .filter((a) => !blockedAttackers.has(a))
      .sort((a, b) => power(b) - power(a));
    let remaining = unblocked.reduce((sum, a) => sum + power(a), 0);
    const myLife = view.state.players[this.playerId].life;
    for (const attacker of unblocked) {
      if (remaining < myLife) break;
      const entry = legal.eligible.find((e) => !used.has(e.blocker) && e.canBlock.includes(attacker));
      if (entry === undefined) continue;
      chosen.set(entry.blocker, attacker);
      used.add(entry.blocker);
      remaining -= power(attacker);
    }

    let blocks: BlockerDeclaration[] = [...chosen].map(([blocker, attacker]) => ({
      blocker,
      attacker,
    }));
    // A menace attacker must be blocked by 0 or 2+ creatures.
    blocks = blocks.filter(
      (b) =>
        !legal.menaceAttackers.includes(b.attacker) ||
        blocks.filter((x) => x.attacker === b.attacker).length >= 2,
    );
    return blocks;
  }
}

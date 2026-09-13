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
  LegalAction,
} from "./actions.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameObject, GameState } from "./state.js";
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
  ): readonly TargetRef[];
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
}

const passFor = (player: PlayerId): Action => ({
  type: "pass-priority",
  player,
});

const discardFromFront = (
  hand: readonly GameObject[],
  count: number,
): readonly ObjectId[] => hand.slice(0, count).map((object) => object.id);

const firstOfEach = (
  legalOptions: readonly (readonly TargetRef[])[],
): readonly TargetRef[] => legalOptions.map((options) => options[0]);

/** The standard combat-damage assignment: lethal down the blocker order, the
 * remainder to the last blocker (or, with trample, over to the defender). */
export const standardDamageAssignment = (a: {
  readonly power: number;
  readonly lethal: readonly number[];
  readonly trample: boolean;
}): number[] => {
  let remaining = a.power;
  return a.lethal.map((lethal, index) => {
    const isLastAndNoTrample = !a.trample && index === a.lethal.length - 1;
    const amount = isLastAndNoTrample ? remaining : Math.min(remaining, lethal);
    remaining -= amount;
    return amount;
  });
};

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
  // The mulligan phase is parallel — this controller may act if it's still in
  // `hands`, not only when it's the `awaiting.player` pointer.
  const mayAct =
    awaiting.kind === "mulligan"
      ? awaiting.hands[player] !== undefined
      : awaiting.player === player;
  if (!mayAct) return null;

  if (awaiting.kind === "attackers") {
    return { type: "declare-attackers", player, attackers: controller.declareAttackers(view) };
  }
  if (awaiting.kind === "blockers") {
    return { type: "declare-blockers", player, blocks: controller.declareBlockers(view) };
  }
  if (awaiting.kind === "order-blockers") {
    const blockers = view.state.objects[awaiting.attacker].blockedBy;
    return {
      type: "order-blockers",
      player,
      attacker: awaiting.attacker,
      order: controller.orderBlockers(view, awaiting.attacker, [...blockers]),
    };
  }
  if (awaiting.kind === "assign-combat-damage") {
    return {
      type: "assign-combat-damage",
      player,
      assignment: controller.assignCombatDamage(view, {
        attacker: awaiting.attacker,
        blockers: awaiting.blockers,
        power: awaiting.power,
        lethal: awaiting.lethal,
        trample: awaiting.trample,
      }),
    };
  }
  if (awaiting.kind === "choose-from-zone") {
    return {
      type: "choose-from-zone",
      player,
      chosen: controller.chooseFromZone(view, awaiting.eligible, awaiting.min, awaiting.max),
    };
  }
  if (awaiting.kind === "mulligan") {
    const hand = awaiting.hands[player];
    if (hand.step === "bottom") {
      const held = view.state.zones.perPlayer[player].hand.map(
        (id) => view.state.objects[id],
      );
      return {
        type: "put-on-bottom",
        player,
        cards: controller.chooseBottomOfLibrary(held, hand.taken),
      };
    }
    return {
      type: "mulligan",
      player,
      keep: !controller.mulligan(view, hand.taken),
    };
  }
  if (awaiting.kind === "commander-replacement") {
    return {
      type: "commander-replacement",
      player,
      toCommandZone: controller.commanderReplacement(
        view,
        awaiting.commander,
        awaiting.intendedZone,
      ),
    };
  }
  if (awaiting.kind === "pay-life-for-untapped") {
    return {
      type: "pay-life-for-untapped",
      player,
      pay: controller.payLifeForUntapped(view, awaiting.source, awaiting.life),
    };
  }
  if (awaiting.kind === "choose-copy") {
    return {
      type: "choose-copy",
      player,
      copy: controller.chooseCopy(view, awaiting.source, awaiting.options),
    };
  }
  if (awaiting.kind === "choose-text") {
    const [from, to] = controller.chooseText(
      view,
      awaiting.fromOptions,
      awaiting.toOptions,
    );
    return { type: "choose-text", player, from, to };
  }
  if (awaiting.kind === "choose-creature-type") {
    return {
      type: "choose-creature-type",
      player,
      creatureType: controller.chooseCreatureType(view, awaiting.source, awaiting.options),
    };
  }
  if (awaiting.kind === "choose-modes") {
    return {
      type: "choose-modes",
      player,
      modes: controller.chooseModes(
        view,
        awaiting.minModes,
        awaiting.maxModes,
        awaiting.modes.map((m) => m.text),
      ),
    };
  }
  if (awaiting.kind === "sacrifice") {
    return {
      type: "sacrifice",
      player,
      permanents: controller.chooseSacrifices(view, awaiting.eligible, awaiting.count),
    };
  }
  if (awaiting.kind === "scry") {
    return {
      type: "scry",
      player,
      away: controller.chooseScry(view, awaiting.cards, awaiting.mode),
    };
  }
  if (awaiting.kind === "choose-targets") {
    return {
      type: "choose-targets",
      player,
      targets: controller.chooseTargets(
        view,
        awaiting.cardName,
        awaiting.specs,
        awaiting.options,
      ),
    };
  }
  const hand = view.state.zones.perPlayer[player].hand.map(
    (id) => view.state.objects[id],
  );
  return {
    type: "discard",
    player,
    cards: controller.chooseDiscards(hand, awaiting.count),
  };
}

/** Always passes priority, never attacks or blocks; discards from the front. */
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
  ): readonly TargetRef[] {
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
  ): string {
    return options[0];
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
) => readonly TargetRef[];
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
  ): readonly TargetRef[] {
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
): { kicked?: boolean; overload?: boolean; sacrifice?: ObjectId } {
  const sac = legal.sacrifice;
  return {
    ...(legal.kicked === true ? { kicked: true } : {}),
    ...(legal.overload === true ? { overload: true } : {}),
    ...(sac !== undefined && sac.choices.length > 0
      ? { sacrifice: sac.choices[pickIndex(sac.choices.length)] }
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

  private pickTargets(
    options: readonly (readonly TargetRef[])[],
  ): readonly TargetRef[] {
    return options.map((choices) => choices[this.pickIndex(choices.length)]);
  }

  private toAction(legal: LegalAction): Action {
    const player = this.playerId;
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
          targets: this.pickTargets(legal.targetOptions),
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
          targets: this.pickTargets(legal.targetOptions),
          ...(sac !== undefined && sac.choices.length > 0
            ? { sacrifice: sac.choices[this.pickIndex(sac.choices.length)] }
            : {}),
          ...(legal.xCost !== undefined
            ? { xValue: this.pickIndex(legal.xCost.maxX + 1) }
            : {}),
        };
      }
      case "declare-attackers":
        return {
          type: "declare-attackers",
          player,
          attackers: legal.eligible
            .filter(() => this.random() < 0.6)
            .map((attacker) => ({
              attacker,
              defender: legal.defenders[this.pickIndex(legal.defenders.length)],
            })),
        };
      case "declare-blockers": {
        const chosen = new Map<ObjectId, ObjectId>(); // blocker -> attacker
        for (const entry of legal.eligible) {
          // Lure (rule 509.1c): a creature able to block a must-be-blocked
          // attacker must block one of them; otherwise a coin flip.
          const mustOptions = entry.canBlock.filter((a) => legal.mustBlock.includes(a));
          if (mustOptions.length > 0) {
            chosen.set(entry.blocker, mustOptions[this.pickIndex(mustOptions.length)]);
          } else if (this.random() < 0.5) {
            chosen.set(entry.blocker, entry.canBlock[this.pickIndex(entry.canBlock.length)]);
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
      }
      case "order-blockers": {
        const order = [...legal.blockers];
        for (let i = order.length - 1; i > 0; i -= 1) {
          const j = this.pickIndex(i + 1);
          const tmp = order[i];
          order[i] = order[j];
          order[j] = tmp;
        }
        return { type: "order-blockers", player, attacker: legal.attacker, order };
      }
      case "assign-combat-damage": {
        // Start from the standard split, then sometimes pile extra onto a
        // blocker instead of trampling / dumping on the last — still legal.
        const assignment = standardDamageAssignment(legal);
        const spare =
          legal.power - assignment.reduce((sum, n) => sum + n, 0);
        if (spare > 0 && assignment.length > 0 && this.random() < 0.5) {
          assignment[this.pickIndex(assignment.length)] += spare;
        }
        return { type: "assign-combat-damage", player, assignment };
      }
      case "discard": {
        const pool = [...legal.from];
        const cards: ObjectId[] = [];
        for (let i = 0; i < legal.count && pool.length > 0; i += 1) {
          cards.push(pool.splice(this.pickIndex(pool.length), 1)[0]);
        }
        return { type: "discard", player, cards };
      }
      case "choose-from-zone": {
        const pool = [...legal.eligible];
        const n = legal.min + Math.floor(this.random() * (legal.max - legal.min + 1));
        const chosen: ObjectId[] = [];
        for (let i = 0; i < n && pool.length > 0; i += 1) {
          chosen.push(pool.splice(this.pickIndex(pool.length), 1)[0]);
        }
        return { type: "choose-from-zone", player, chosen };
      }
      case "mulligan": {
        // Capped so a fuzz game can't mulligan forever.
        const takeMulligan = legal.count < 4 && this.random() < 0.2;
        return { type: "mulligan", player, keep: !takeMulligan };
      }
      case "put-on-bottom": {
        const pool = [...legal.from];
        const cards: ObjectId[] = [];
        for (let i = 0; i < legal.count && pool.length > 0; i += 1) {
          cards.push(pool.splice(this.pickIndex(pool.length), 1)[0]);
        }
        return { type: "put-on-bottom", player, cards };
      }
      case "commander-replacement":
        return { type: "commander-replacement", player, toCommandZone: this.random() < 0.85 };
      case "pay-life-for-untapped":
        return { type: "pay-life-for-untapped", player, pay: this.random() < 0.7 };
      case "choose-copy": {
        // Usually copy the biggest thing; sometimes copy nothing.
        const copy =
          legal.options.length > 0 && this.random() < 0.9
            ? legal.options[this.pickIndex(legal.options.length)]
            : null;
        return { type: "choose-copy", player, copy };
      }
      case "choose-text": {
        const from = legal.fromOptions[this.pickIndex(legal.fromOptions.length)];
        const to = legal.toOptions[this.pickIndex(legal.toOptions.length)];
        return { type: "choose-text", player, from, to };
      }
      case "choose-creature-type": {
        const creatureType = legal.options[this.pickIndex(legal.options.length)];
        return { type: "choose-creature-type", player, creatureType };
      }
      case "choose-modes": {
        const count =
          legal.minModes +
          Math.floor(this.random() * (legal.maxModes - legal.minModes + 1));
        const pool = legal.modeTexts.map((_text, i) => i);
        const modes: number[] = [];
        for (let i = 0; i < count && pool.length > 0; i += 1) {
          modes.push(pool.splice(this.pickIndex(pool.length), 1)[0]);
        }
        return { type: "choose-modes", player, modes };
      }
      case "sacrifice": {
        const pool = [...legal.eligible];
        const permanents: ObjectId[] = [];
        for (let i = 0; i < legal.count && pool.length > 0; i += 1) {
          permanents.push(pool.splice(this.pickIndex(pool.length), 1)[0]);
        }
        return { type: "sacrifice", player, permanents };
      }
      case "scry": {
        const away = legal.cards.filter(() => this.random() < 0.5);
        return { type: "scry", player, away };
      }
      case "choose-targets":
        return { type: "choose-targets", player, targets: this.pickTargets(legal.options) };
      default:
        return passFor(player);
    }
  }
}

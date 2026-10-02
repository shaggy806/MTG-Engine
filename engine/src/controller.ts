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
  TapCostOffer,
} from "./actions.js";
import { convokeProofFor } from "./actions.js";
import { obeyingLure } from "./combat/blocking.js";
import { whyCannotAttack } from "./combat/eligibility.js";
import { standardAssignment } from "./combat/damage.js";
import type { DamageAssignmentOffer } from "./combat/damage.js";
import { polarityBias } from "./deck-bias.js";
import { matchesFilter } from "./filter.js";
import { decisionFor, mayActOn, randomAnswerFor } from "./decisions/registry.js";
import type { RandomSource } from "./decisions/contract.js";
import { assignedCombatDamage, combatDamageOf, computeCharacteristics } from "./characteristics.js";
import { CardRegistry, createDefaultRegistry } from "./cards.js";
import { chooseBottomOfHand, shouldMulligan } from "./bot/mulligan.js";
import { newColorsFirst } from "./land-colors.js";
import { scryAway } from "./scry-pick.js";
import { manaValue, parseManaCost } from "./mana.js";
import type { EffectSpec } from "./effects.js";
import {
  costWorth,
  effectWorth,
  entersToCounter,
  onlyUntilEndOfTurn,
  temporaryEffectCanMatter,
} from "./effect-worth.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { EnterAttackingChoice, GameObject, GameState, TriggerOrderEntry } from "./state.js";
import { activePlayerOf, printedCardName } from "./state.js";
import { anyNumberSlot, isOptionalSpec, slotOptions, targetsFillable } from "./target.js";
import type { TargetRef, TargetSpec } from "./target.js";
import { fitTargetCount, maxXForTargets } from "./target-count.js";
import {
  auraPolarity,
  modalPolarities,
  offerPolarities,
  onlyWrongSide,
  pendingTargetPolarities,
  rankTargets,
  targetValue,
} from "./target-polarity.js";
import type { Polarity } from "./target-polarity.js";

export type { AttackerDeclaration, BlockerDeclaration };

export interface ControllerView {
  readonly state: GameState;
  readonly player: PlayerId;
  /** Everything this player may legally do right now. */
  legalActions(): readonly LegalAction[];
  /**
   * What this player could legally do if `action` were dispatched now,
   * asked of a throwaway copy of the game — `null` if the engine refused it.
   * Optional: a view built outside a `Game` (a test, a tool) may not offer
   * it, and a controller must still decide without.
   */
  legalActionsAfter?(action: Action): readonly LegalAction[] | null;
}

/**
 * The first `count` permanents from `eligible`, taking a compacted token
 * stack as many times as it has tokens (docs/architecture/engine.md, "Token stacking"). An
 * `eligible` list is one entry per *object*, so a plain `slice(0, count)`
 * returns too few whenever a stack is on the board — and too few is not a
 * legal answer, which is how "sacrifice three" against nine stacked Goblins
 * used to stall the game outright.
 */
export function takeSacrifices(
  view: ControllerView,
  eligible: readonly ObjectId[],
  count: number,
): readonly ObjectId[] {
  const picked: ObjectId[] = [];
  for (const id of eligible) {
    const copies = view.state.objects[id]?.stackCount ?? 1;
    for (let i = 0; i < copies && picked.length < count; i += 1) picked.push(id);
    if (picked.length >= count) break;
  }
  return picked;
}

export interface PlayerController {
  readonly playerId: PlayerId;
  /** Called whenever this player holds priority. Return an action to take. */
  act(view: ControllerView): Action;
  /** Choose exactly `count` cards from `hand` to discard. `view` is the
   * board it's asked on, for a controller that weighs a card by what's
   * already in play. */
  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
    view?: ControllerView,
  ): readonly ObjectId[];
  /** Declare this player's attackers. */
  declareAttackers(view: ControllerView): readonly AttackerDeclaration[];
  /** Declare this player's blockers. */
  declareBlockers(view: ControllerView): readonly BlockerDeclaration[];
  /**
   * Assign a blocked attacker's combat damage (rule 510.1c). Return one
   * amount per blocker in `blockers` order; `power − sum` (allowed only with
   * `trample`, and it must be ≥ 0) goes to the defending player / planeswalker.
   * `lethal[i]` is what counts as lethal to each blocker: any division among
   * them is legal, but damage may trample over only once every blocker has
   * its lethal (rule 702.19b). Reached via `act` when
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
      readonly indestructible: readonly boolean[];
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
   * "You may cast that card" during a resolution (the `cast-now` decision):
   * one of `offer.casts` built into a `cast-spell` action (modes, X,
   * targets, costs — as from priority), or `null` to decline.
   */
  chooseCastNow(view: ControllerView, offer: CastNowOffer): CastSpellAction | null;
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
   * A commander is in a graveyard or exile (rule 903.9a), or is about to be
   * put into a hand or library (903.9b) — `movedTo` says which. Return `true`
   * to put it into the command zone, `false` to leave it there, or let it go.
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
   * A reveal land (`source`) is about to enter — return which of `options`,
   * the qualifying cards in hand, to reveal so it enters untapped, or `null`
   * to reveal nothing and have it enter tapped.
   */
  revealForUntapped(
    view: ControllerView,
    source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null;
  /**
   * A Clone-style permanent is about to enter — return which of `options` it
   * enters as a copy of, or `null` to copy nothing (rule 707.9).
   */
  chooseCopy(
    view: ControllerView,
    source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null;
  /**
   * An Aura is entering the battlefield without being cast, and nothing says
   * what it enchants — return which of `options`, the permanents it could
   * enchant, it enters attached to (rule 303.4f).
   */
  chooseEnchant(view: ControllerView, source: ObjectId, options: readonly ObjectId[]): ObjectId;
  /**
   * The legend rule (704.5j): you control two or more legendary permanents
   * named `name` — return which of `options` (the one you've controlled
   * longest first) to keep; the rest go to the graveyard.
   */
  chooseLegendToKeep(view: ControllerView, name: string, options: readonly ObjectId[]): ObjectId;
  /**
   * Rule 603.3b: order your simultaneous triggered abilities — return every
   * index of `triggers` once, the one to resolve first first. `triggers` is
   * the engine's own order. Asked only of a player who orders their own
   * (`Game.setOrdersOwnTriggers`).
   */
  orderTriggers(view: ControllerView, triggers: readonly TriggerOrderEntry[]): number[];
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
  /**
   * An effect is resolving that chooses permanents without targeting them
   * ("untap up to two lands"): return from `min` to `max` of `eligible`,
   * a compacted token stack named once per token.
   */
  choosePermanents(
    view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ): readonly ObjectId[];
  /**
   * Creatures were put onto the battlefield attacking with a choice of what
   * each attacks (rule 508.4): one of its `options` for every one of them.
   */
  chooseAttackTargets(
    view: ControllerView,
    creatures: readonly EnterAttackingChoice[],
  ): readonly AttackTargetChoice[];
}

/** One answer to `chooseAttackTargets`. */
export interface AttackTargetChoice {
  readonly object: ObjectId;
  readonly target: PlayerId | ObjectId;
}

/**
 * The default answer to what creatures entering attacking attack: the
 * opponent with the least life among each one's options — damage finishes a
 * player sooner than it spreads — and a planeswalker only when no player is
 * on offer.
 */
export function attackLowestLife(
  view: ControllerView,
  creatures: readonly EnterAttackingChoice[],
): readonly AttackTargetChoice[] {
  return creatures.map(({ object, options }) => {
    const players = options.filter((o) => view.state.players[o as PlayerId] !== undefined) as PlayerId[];
    const pick =
      players.length > 0
        ? players.reduce((best, p) => (view.state.players[p].life < view.state.players[best].life ? p : best))
        : options[0];
    return { object, target: pick };
  });
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
/** Slot `i`'s options, less any that would leave a later required slot with
 * no legal target (see `targetsFillable`). */
const fillableOptions = (
  specs: readonly TargetSpec[],
  options: readonly (readonly TargetRef[])[],
  i: number,
  picked: readonly (TargetRef | null)[],
): readonly TargetRef[] =>
  slotOptions(specs, options, i, picked).filter((ref) => targetsFillable(specs, options, [...picked, ref]));

const firstOfEach = (
  legalOptions: readonly (readonly TargetRef[])[],
  specs: readonly TargetSpec[] = [],
): ChosenTargets => {
  // Slot by slot, so an "another target" slot skips what an earlier one took
  // — and never takes what a later one is left needing.
  const picked: (TargetRef | null)[] = [];
  const group = anyNumberSlot(specs);
  for (let i = 0; i < legalOptions.length; i += 1) {
    const first = fillableOptions(specs, legalOptions, i, picked)[0];
    // An "any number of" group (always last) takes one member, or none —
    // never a hole, which would be a member with no target.
    if (i === group) {
      if (first !== undefined) picked.push(first);
      break;
    }
    picked.push(first ?? null);
  }
  return picked;
};

/**
 * The standard combat-damage assignment: kill as many blockers as possible,
 * the ones needing least first, then trample the rest over or leave it on a
 * blocker (see `standardAssignment`).
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

  assignCombatDamage(_view: ControllerView, a: DamageAssignmentOffer): readonly number[] {
    return standardDamageAssignment(a);
  }

  chooseTargets(
    _view: ControllerView,
    _sourceName: string,
    specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): ChosenTargets {
    return firstOfEach(legalOptions, specs);
  }

  /** Declines; the controllers that cast things override it. */
  chooseCastNow(_view: ControllerView, _offer: CastNowOffer): CastSpellAction | null {
    return null;
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

  commanderReplacement(
    view: ControllerView,
    commander: ObjectId,
    movedTo: "graveyard" | "exile" | "hand" | "library",
  ): boolean {
    // A commander bounced to its owner's hand stays there: casting it from the
    // hand costs no commander tax (rule 903.8 taxes only casts from the
    // command zone), so the command zone is strictly worse.
    if (movedTo === "hand") return false;
    // The command zone — but a commander in exile that can still be cast from
    // there (on an adventure, foretold, suspended) is where its owner put it
    // on purpose, and casting it from there costs no tax.
    const object = view.state.objects[commander];
    return !(
      object?.zone === "exile" &&
      (object.onAdventure || object.foretold || object.suspended)
    );
  }

  payLifeForUntapped(): boolean {
    // Conservative default: never bleed life for an untapped land (declining
    // is always legal). Tests that care override via a ScriptedController.
    return false;
  }

  revealForUntapped(
    _view: ControllerView,
    _source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null {
    // Always reveal: an untapped land is worth more than a hidden card,
    // since nothing here plays on what an opponent knows of a hand.
    return options[0] ?? null;
  }

  chooseCopy(
    _view: ControllerView,
    _source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null {
    return options[0] ?? null;
  }

  chooseEnchant(_view: ControllerView, _source: ObjectId, options: readonly ObjectId[]): ObjectId {
    return options[0];
  }

  /** Keeps the one controlled longest — what the engine did before the
   * choice was a player's. */
  chooseLegendToKeep(_view: ControllerView, _name: string, options: readonly ObjectId[]): ObjectId {
    return options[0];
  }

  /** The engine's own order, as offered. */
  orderTriggers(_view: ControllerView, triggers: readonly TriggerOrderEntry[]): number[] {
    return triggers.map((_, i) => i);
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
    view: ControllerView,
    eligible: readonly ObjectId[],
    count: number,
  ): readonly ObjectId[] {
    return takeSacrifices(view, eligible, count);
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

  choosePermanents(
    view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ): readonly ObjectId[] {
    return ownPermanentsFirst(view, eligible, min, max);
  }

  chooseAttackTargets(
    view: ControllerView,
    creatures: readonly EnterAttackingChoice[],
  ): readonly AttackTargetChoice[] {
    return attackLowestLife(view, creatures);
  }
}

/**
 * The default "choose up to N" answer: as many of your own as allowed, then
 * anyone's only as far as `min` demands. "Untap up to two lands" is nearly
 * always about your lands, and untapping an opponent's is the move to avoid.
 */
function ownPermanentsFirst(
  view: ControllerView,
  eligible: readonly ObjectId[],
  min: number,
  max: number,
): readonly ObjectId[] {
  const mine = eligible.filter((id) => view.state.objects[id]?.controller === view.player);
  const out = mine.slice(0, max);
  for (const id of eligible) {
    if (out.length >= min) break;
    if (!out.includes(id)) out.push(id);
  }
  return out;
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
  // A player's counters are theirs to want or not: yourself unless you're
  // poisoned, an opponent only if they are.
  const poisoned = (player: PlayerId): boolean =>
    (view.state.players[player]?.counters.poison ?? 0) > 0;
  return eligible.filter((target) =>
    target.kind === "player"
      ? target.player === view.player
        ? !poisoned(target.player)
        : poisoned(target.player)
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
    readonly indestructible: readonly boolean[];
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
  /** "You may cast that card" — declines by default. */
  chooseCastNowFn: (view: ControllerView, offer: CastNowOffer) => CastSpellAction | null = () => null;
  /** Which cards to discard — a cost's or an effect's. The front of the hand
   * by default. */
  chooseDiscardsFn: (hand: readonly GameObject[], count: number) => readonly ObjectId[] = (hand, count) =>
    discardFromFront(hand, count);
  declareBlockersFn: BlockChooser = () => [];
  assignCombatDamageFn: DamageAssigner = (_view, a) => standardDamageAssignment(a);
  chooseTargetsFn: TargetChooser = (_view, _source, specs, legalOptions) =>
    firstOfEach(legalOptions, specs);
  chooseFromZoneFn: ZoneChooser = (_view, eligible, min, _max) => eligible.slice(0, min);
  mulliganFn: MulliganChooser = () => false;
  chooseBottomOfLibraryFn: BottomChooser = (hand, count) => discardFromFront(hand, count);
  commanderReplacementFn: CommanderReplacementChooser = () => true;
  payLifeForUntappedFn: (view: ControllerView, source: ObjectId, life: number) => boolean =
    () => false;
  revealForUntappedFn: CopyChooser = (_view, _source, options) => options[0] ?? null;
  chooseCopyFn: CopyChooser =(_view, _source, options) => options[0] ?? null;
  chooseEnchantFn: (view: ControllerView, source: ObjectId, options: readonly ObjectId[]) => ObjectId = (
    _view,
    _source,
    options,
  ) => options[0];
  chooseLegendToKeepFn: (view: ControllerView, name: string, options: readonly ObjectId[]) => ObjectId = (
    _view,
    _name,
    options,
  ) => options[0];
  orderTriggersFn: (view: ControllerView, triggers: readonly TriggerOrderEntry[]) => number[] = (_view, triggers) =>
    triggers.map((_, i) => i);
  chooseTextFn: TextChooser = (_view, fromOptions, toOptions) => [
    fromOptions[0],
    toOptions[0],
  ];
  chooseCreatureTypeFn: CreatureTypeChooser = (_view, _source, options) => options[0];
  chooseModesFn: ModesChooser = (_view, minModes) =>
    Array.from({ length: minModes }, (_unused, i) => i);
  chooseSacrificesFn: SacrificeChooser = (view, eligible, count) =>
    takeSacrifices(view, eligible, count);
  chooseScryFn: ScryChooser = () => [];

  /** Defaults to the same "everything you control" answer the other
   * controllers give, so a script only overrides it when the test is actually
   * about the choice. */
  chooseProliferateFn: ProliferateChooser = (view, eligible) =>
    ownedProliferateTargets(view, eligible);
  /** Your own first, up to `max` — see `ownPermanentsFirst`. */
  choosePermanentsFn: (
    view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ) => readonly ObjectId[] = (view, eligible, min, max) => ownPermanentsFirst(view, eligible, min, max);
  /** The opponent with the least life — see `attackLowestLife`. */
  chooseAttackTargetsFn: (
    view: ControllerView,
    creatures: readonly EnterAttackingChoice[],
  ) => readonly AttackTargetChoice[] = attackLowestLife;

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
    return this.chooseDiscardsFn(hand, count);
  }

  declareAttackers(view: ControllerView): readonly AttackerDeclaration[] {
    return this.declareAttackersFn(view);
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    return this.declareBlockersFn(view);
  }

  assignCombatDamage(
    view: ControllerView,
    a: {
      readonly attacker: ObjectId;
      readonly blockers: readonly ObjectId[];
      readonly power: number;
      readonly lethal: readonly number[];
      readonly trample: boolean;
      readonly indestructible: readonly boolean[];
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

  chooseCastNow(view: ControllerView, offer: CastNowOffer): CastSpellAction | null {
    return this.chooseCastNowFn(view, offer);
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

  revealForUntapped(
    view: ControllerView,
    source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null {
    return this.revealForUntappedFn(view, source, options);
  }

  chooseCopy(
    view: ControllerView,
    source: ObjectId,
    options: readonly ObjectId[],
  ): ObjectId | null {
    return this.chooseCopyFn(view, source, options);
  }

  chooseEnchant(view: ControllerView, source: ObjectId, options: readonly ObjectId[]): ObjectId {
    return this.chooseEnchantFn(view, source, options);
  }

  chooseLegendToKeep(view: ControllerView, name: string, options: readonly ObjectId[]): ObjectId {
    return this.chooseLegendToKeepFn(view, name, options);
  }

  orderTriggers(view: ControllerView, triggers: readonly TriggerOrderEntry[]): number[] {
    return this.orderTriggersFn(view, triggers);
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

  choosePermanents(
    view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ): readonly ObjectId[] {
    return this.choosePermanentsFn(view, eligible, min, max);
  }

  chooseAttackTargets(
    view: ControllerView,
    creatures: readonly EnterAttackingChoice[],
  ): readonly AttackTargetChoice[] {
    return this.chooseAttackTargetsFn(view, creatures);
  }
}

/**
 * The cast-time extras a `cast-spell` `LegalAction` may demand beyond targets:
 * the `kicked` flag (the engine enumerates kicked and unkicked as separate
 * actions, so it's just echoed back) and a choice of which permanent pays an
 * additional sacrifice cost (rule 601.2f — Harrow). needed-cards P8.
 */
/**
 * `count` of a tap cost's choices at random, a stack's id once per token
 * picked — the fuzzer's answer to a `tapCost` offer. Every token of a stack
 * is its own draw, so picking three of a stack of nine is as likely as
 * picking any three separate creatures.
 */
function randomTapPicks(offer: TapCostOffer, pickIndex: (n: number) => number): ObjectId[] {
  const pool: ObjectId[] = [];
  for (const id of offer.choices) {
    for (let i = 0; i < (offer.copies?.[id] ?? 1); i += 1) pool.push(id);
  }
  const picked: ObjectId[] = [];
  for (let i = 0; i < offer.count && pool.length > 0; i += 1) {
    picked.push(pool.splice(pickIndex(pool.length), 1)[0]);
  }
  return picked;
}

/**
 * The fuzzer's answer to an escape cost's "exile N other cards from your
 * graveyard" offer: the newest `count` choices. Not the engine's own pick for
 * a driver that names none (the oldest), so the fuzzer exercises the chosen,
 * validated path; and drawn from no random source, since one more draw here
 * would re-point every fuzzer seed.
 */
function escapeExilePicks(
  legal: Extract<LegalAction, { kind: "cast-spell" }>,
): { escapeExile?: ObjectId[] } {
  const offer = legal.escapeExile;
  if (offer === undefined) return {};
  return { escapeExile: offer.choices.slice(offer.choices.length - offer.count) };
}

/**
 * `chosen`, fitted to the distinct-target range a `cast-spell` offer is
 * affordable at when a "for each target" cost modification reaches it
 * (Hinata, Dawn-Crowned — `LegalAction.targetCount`), else as it stands.
 * `null` when no re-pointing fits, and the driver should do something else.
 * Draws nothing from any random source, so a fuzzer seed replays the same
 * whether or not the offer carried a range.
 */
export function fitCastTargets(
  legal: Extract<LegalAction, { kind: "cast-spell" }>,
  chosen: readonly (TargetRef | null)[],
  options: readonly (readonly TargetRef[])[],
  specs: readonly TargetSpec[],
): (TargetRef | null)[] | null {
  if (legal.targetCount === undefined) return [...chosen];
  return fitTargetCount(chosen, options, specs, legal.targetCount);
}

function castExtras(
  legal: Extract<LegalAction, { kind: "cast-spell" }>,
  pickIndex: (n: number) => number,
  xValue = 0,
): {
  kicked?: boolean;
  overload?: boolean;
  free?: boolean;
  altCost?: boolean;
  costOption?: number;
  sacrifice?: ObjectId;
  convoke?: ConvokePayment[];
  prototype?: boolean;
} {
  const sac = legal.sacrifice;
  const convokeInfo = legal.convoke;
  return {
    ...(legal.kicked === true ? { kicked: true } : {}),
    ...(legal.offspring === true ? { offspring: true } : {}),
    ...(legal.evoke === true ? { evoke: true, evokeCost: legal.evokeCost } : {}),
    // Prototyped is a variant of its own, like kicked: echoed back.
    ...(legal.prototype === true ? { prototype: true } : {}),
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
    // covered directly by `convoke.test.ts`. An X spell takes the payment
    // proved for its largest X, trimmed to the X actually chosen.
    ...(() => {
      if (convokeInfo === undefined) return {};
      const convoke = convokeProofFor(convokeInfo, xValue);
      return convoke.length > 0 ? { convoke } : {};
    })(),
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
    const picked: (TargetRef | null)[] = [];
    const group = anyNumberSlot(specs);
    for (let i = 0; i < options.length; i += 1) {
      // Narrowed by an "another target" relation to an earlier slot's pick.
      const choices = fillableOptions(specs, options, i, picked);
      // An "any number of" group (always last): a random subset of its
      // candidates, none included.
      if (i === group) {
        // No more than the group's `max` (Magma Opus's four); a group without
        // one draws exactly as it always has.
        const spec = specs[group];
        const max = typeof spec === "object" && spec.kind === "any-number" ? spec.max : undefined;
        for (const ref of choices) {
          if (max !== undefined && picked.length - group >= max) break;
          if (this.random() < 0.5) picked.push(ref);
        }
        break;
      }
      if (choices.length === 0) picked.push(null);
      else if (isOptionalSpec(specs[i] ?? "creature") && this.random() < 0.25) picked.push(null);
      else picked.push(choices[this.pickIndex(choices.length)]);
    }
    return picked;
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
          ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
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
          const picked = modes.flatMap((i) => this.pickTargets(cm.modes[i].targetOptions));
          const targets = fitCastTargets(
            legal,
            picked,
            modes.flatMap((i) => cm.modes[i].targetOptions),
            modes.flatMap((i) => cm.modes[i].targetSpecs),
          );
          if (targets === null) return passFor(player);
          return {
            type: "cast-spell",
            player,
            card: legal.card,
            targets,
            modes,
            ...(legal.via !== undefined ? { via: legal.via } : {}),
            ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
            ...(legal.face !== undefined ? { face: legal.face } : {}),
            ...castExtras(legal, (n) => this.pickIndex(n)),
            ...(legal.tapCost !== undefined
              ? { tap: randomTapPicks(legal.tapCost, (n) => this.pickIndex(n)) }
              : {}),
            ...escapeExilePicks(legal),
          };
        }
        // Drawn in this order — targets, X, then the extras — so a seed
        // replays the same game.
        const targets = fitCastTargets(
          legal,
          this.pickTargets(legal.targetOptions, legal.targetSpecs),
          legal.targetOptions,
          legal.targetSpecs,
        );
        if (targets === null) return passFor(player);
        const xValue =
          legal.xCost !== undefined
            ? this.pickIndex(maxXForTargets(legal.xCost, legal.targetCount, targets) + 1)
            : undefined;
        return {
          type: "cast-spell",
          player,
          card: legal.card,
          targets,
          ...(xValue !== undefined ? { xValue } : {}),
          ...(legal.via !== undefined ? { via: legal.via } : {}),
          ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
          ...(legal.face !== undefined ? { face: legal.face } : {}),
          ...castExtras(legal, (n) => this.pickIndex(n), xValue),
          ...(legal.tapCost !== undefined
            ? { tap: randomTapPicks(legal.tapCost, (n) => this.pickIndex(n)) }
            : {}),
          ...escapeExilePicks(legal),
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
            ? {
                // `minX` is 0 but on an offer whose targets fix X, so every
                // other ability draws exactly what it always has.
                xValue:
                  (legal.xCost.minX ?? 0) +
                  this.pickIndex(legal.xCost.maxX - (legal.xCost.minX ?? 0) + 1),
              }
            : {}),
          ...(legal.tapCost !== undefined
            ? { tap: randomTapPicks(legal.tapCost, (n) => this.pickIndex(n)) }
            : {}),
        };
      }
      default:
        return passFor(player);
    }
  }
}

type CastSpellLegal = Extract<LegalAction, { kind: "cast-spell" }>;
type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;
type CastSpellAction = Extract<Action, { type: "cast-spell" }>;
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

/** How far above its host a creature must rank (`targetValue`) before v1
 * moves equipment onto it: about a 2/2's worth, so near-equals never trade
 * it back and forth (`isPointlessReattach`). */
const REATTACH_MARGIN = 3;

/** A fetch that pays life (Polluted Delta) isn't cracked at this much life or
 * less above its payment — see `isFreeFetch`. */
const FETCH_LIFE_FLOOR = 4;

/** The life an effect makes its controller lose outright — a ward payment's
 * "Pay N life" part, which is a `lose-life` of `"you"` inside its mode. */
function lifePaidBy(effect: EffectSpec | undefined): number {
  if (effect === undefined) return 0;
  if (effect.kind === "sequence") {
    return effect.effects.reduce((n, each) => n + lifePaidBy(each), 0);
  }
  return effect.kind === "lose-life" && effect.who === "you" && typeof effect.amount === "number"
    ? effect.amount
    : 0;
}

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
        if (mana !== "C" && mana !== "chosen" && mana !== "produced") out.push(mana as Color);
      } else if ("oneOf" in mana) {
        for (const m of mana.oneOf) if (m !== "C") out.push(m as Color);
      } else if ("all" in mana) {
        for (const m of mana.all) if (m !== "C") out.push(m as Color);
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
   * So the choice is made here, first on what each land lets us cast *this
   * turn* (`castableAfter`), and then, among lands that unlock the same
   * number of spells, on how many coloured pips in hand a land unlocks that
   * no land already on the battlefield can pay. Pips alone get it wrong: with
   * a Mountain down and {R}{R} and {U}{U} spells in hand, an Island adds a
   * colour the hand wants, but buys nothing now, and a second Mountain casts
   * the red spell (reported from a live game). Ties keep enumeration order,
   * which keeps the bot deterministic.
   */
  private bestLand(view: ControllerView, lands: readonly PlayLandLegal[]): PlayLandLegal {
    if (lands.length === 1) return lands[0];
    const state = view.state;
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
    let bestCastable = -1;
    let bestScore = -1;
    for (const land of lands) {
      const castable = this.castableAfter(view, land);
      let score = 0;
      for (const color of new Set(this.colorsProducedBy(land.cardName))) {
        const wanted = want.get(color) ?? 0;
        if (wanted === 0) continue;
        // A colour already covered is worth far less than a new one, but not
        // nothing — a second source still helps cast {G}{G}.
        score += have.has(color) ? wanted : wanted * 10 + 100;
      }
      if (castable > bestCastable || (castable === bestCastable && score > bestScore)) {
        bestCastable = castable;
        bestScore = score;
        best = land;
      }
    }
    return best;
  }

  /**
   * How many different spells we could cast right after playing `land` — the
   * engine's own answer, so cost reductions, alternative costs and lands that
   * enter tapped all count as they would. 0 when the view can't say, which
   * leaves the choice to the pip count.
   */
  private castableAfter(view: ControllerView, land: PlayLandLegal): number {
    const after = view.legalActionsAfter?.(this.toPlayLand(land));
    if (after === null || after === undefined) return 0;
    return new Set(after.flatMap((a) => (a.kind === "cast-spell" ? [a.card] : []))).size;
  }

  private toPlayLand(legal: PlayLandLegal): Action {
    return {
      type: "play-land",
      player: this.playerId,
      card: legal.card,
      ...(legal.face !== undefined ? { face: legal.face } : {}),
      ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
    };
  }

  private toCastSpell(state: GameState, legal: CastSpellLegal): Action {
    const player = this.playerId;
    // An additional cost's sacrifice gives up the cheapest permanent it may.
    // (Convoke doesn't come through here: `castExtras` echoes the payment
    // `legalActions` proved.)
    const sacrificeChoices = legal.sacrifice?.choices ?? [];
    const pickLast = (): number =>
      sacrificeChoices.indexOf(this.cheapestPermanents(state, sacrificeChoices, 1)[0]);
    if (legal.castModal !== undefined) {
      const cm = legal.castModal;
      const byMode = modalPolarities(this.registry, legal, polarityBias(state, this.playerId));
      const modes = this.usableModes(state, legal);
      if (modes === null) return passFor(player);
      const targets = fitCastTargets(
        legal,
        modes.flatMap((i) =>
          this.aimedTargets(state, cm.modes[i].targetOptions, cm.modes[i].targetSpecs, byMode?.[i] ?? null),
        ),
        modes.flatMap((i) => cm.modes[i].targetOptions),
        modes.flatMap((i) => cm.modes[i].targetSpecs),
      );
      if (targets === null) return passFor(player);
      // A modal spell with X (Clan Defiance) is cast at its largest X like
      // any other. Left out, the engine reads X as 0 — which is how this bot
      // used to cast it, for no damage at all.
      const modalX = legal.xCost === undefined ? undefined : maxXForTargets(legal.xCost, legal.targetCount, targets);
      return {
        type: "cast-spell",
        player,
        card: legal.card,
        targets,
        modes,
        ...(modalX !== undefined ? { xValue: modalX } : {}),
        ...(legal.via !== undefined ? { via: legal.via } : {}),
        ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
        ...(legal.face !== undefined ? { face: legal.face } : {}),
        ...castExtras(legal, pickLast, modalX),
      };
    }
    const targets = fitCastTargets(
      legal,
      this.aimedTargets(
        state,
        legal.targetOptions,
        legal.targetSpecs,
        offerPolarities(this.registry, legal, polarityBias(state, this.playerId)),
      ),
      legal.targetOptions,
      legal.targetSpecs,
    );
    if (targets === null) return passFor(player);
    // Its largest X with the targets chosen: under Fireball's "{1} more for
    // each target beyond the first", more targets leave less for X.
    const xValue = legal.xCost === undefined ? undefined : maxXForTargets(legal.xCost, legal.targetCount, targets);
    return {
      type: "cast-spell",
      player,
      card: legal.card,
      targets,
      ...(xValue !== undefined ? { xValue } : {}),
      ...(legal.via !== undefined ? { via: legal.via } : {}),
      ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
      ...(legal.face !== undefined ? { face: legal.face } : {}),
      ...castExtras(legal, pickLast, xValue),
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
   * A fetch: a land that makes no mana itself sacrificing itself to put a
   * land onto the battlefield (Evolving Wilds, Fabled Passage, Polluted
   * Delta). Holding one gains nothing — it can't pay for anything — so it's
   * cracked the moment it can be, which the evaluation alone never chose:
   * a land traded for a tapped land scores as a wash. A land that also taps
   * for mana (Bountiful Landscape) is a real choice and isn't one of these;
   * nor is one that costs mana to crack, nor one whose life payment would
   * leave the bot nearly dead.
   */
  protected isFreeFetch(state: GameState, source: ObjectId, abilityIndex: number): boolean {
    const object = state.objects[source];
    if (object === undefined || object.zone !== "battlefield" || !this.registry.has(object.cardName)) {
      return false;
    }
    const def = this.registry.get(object.cardName);
    if (!def.types.includes("land")) return false;
    const abilities = def.activated ?? [];
    const ability = abilities[abilityIndex];
    if (ability === undefined || ability.cost.sacrifice !== "self" || ability.cost.mana !== null) return false;
    const payLife = ability.cost.payLife ?? 0;
    if (payLife > 0 && (state.players[this.playerId]?.life ?? 0) <= payLife + FETCH_LIFE_FLOOR) return false;
    if (abilities.some((a) => JSON.stringify(a.effect ?? null).includes('"add-mana"'))) return false;
    const effect = JSON.stringify(ability.effect ?? null);
    return effect.includes('"search-library"') && effect.includes('"destination":"battlefield"');
  }

  /**
   * Equipment that's already on one of this bot's creatures, unless the
   * creature it would move to ranks clearly above its host (`targetValue`,
   * by `REATTACH_MARGIN`): Lightning Greaves onto the six-drop just cast,
   * not back and forth. Moving it whenever it could, with Equip {0} free,
   * shuffled it between two creatures forever and the game never left that
   * main phase; the margin, and the host keeping the equipment's own boost
   * in its value, keep a move from ever undoing itself.
   */
  private isPointlessReattach(state: GameState, legal: ActivateAbilityLegal): boolean {
    if (!this.registry.has(legal.cardName)) return false;
    const ability = this.registry.get(legal.cardName).activated?.[legal.abilityIndex];
    if (ability?.effect?.kind !== "attach") return false;
    const on = state.objects[legal.source]?.attachedTo;
    if (on === null || on === undefined) return false;
    const options = (legal.targetOptions[0] ?? []).filter(
      (ref) => !(ref.kind === "object" && ref.object === on),
    );
    const best = rankTargets(state, this.registry, this.playerId, options, "help")[0];
    if (best === undefined) return true;
    const host = targetValue(state, this.registry, { kind: "object", object: on });
    return targetValue(state, this.registry, best) <= host + REATTACH_MARGIN;
  }

  private toActivateAbility(state: GameState, legal: ActivateAbilityLegal): Action {
    const player = this.playerId;
    const sac = legal.sacrifice;
    return {
      type: "activate-ability",
      player,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: this.aimedTargets(
        state,
        legal.targetOptions,
        legal.targetSpecs,
        offerPolarities(this.registry, legal, polarityBias(state, this.playerId)),
      ),
      ...(sac !== undefined && sac.choices.length > 0
        ? { sacrifice: this.cheapestPermanents(state, sac.choices, 1)[0] }
        : {}),
      ...(legal.xCost !== undefined ? { xValue: legal.xCost.maxX } : {}),
    };
  }

  /**
   * `count` of `eligible` — this bot's own permanents — least valuable first
   * (`targetValue`), a token below the card it's worth the same as, and a
   * token stack as many times as it has tokens. What a sacrifice, an edict
   * or a cost gives up; v1 used to give up whatever was listed first, which
   * is the oldest permanent, or the last, which is the newest.
   */
  private cheapestPermanents(
    state: GameState,
    eligible: readonly ObjectId[],
    count: number,
  ): readonly ObjectId[] {
    const worth = (id: ObjectId): number =>
      targetValue(state, this.registry, { kind: "object", object: id }) -
      (state.objects[id]?.isToken === true ? 1 : 0);
    const ranked = eligible
      .map((id, index) => ({ id, index, worth: worth(id) }))
      .sort((a, b) => a.worth - b.worth || a.index - b.index)
      .map((entry) => entry.id);
    const picked: ObjectId[] = [];
    for (const id of ranked) {
      const copies = state.objects[id]?.stackCount ?? 1;
      for (let i = 0; i < copies && picked.length < count; i += 1) picked.push(id);
      if (picked.length >= count) break;
    }
    return picked;
  }

  /**
   * Whether `offer` only pumps, grants keywords or animates until end of
   * turn, at a moment when that can't matter — outside combat, outside my
   * own first main phase, with nothing on the stack to answer
   * (`temporaryEffectCanMatter`). Such an offer is left alone, by v1 and by
   * v2's search alike: its mana is better kept for a spell. A granted ability
   * or a modal or multi-face spell, whose effect isn't read here, is never
   * left out.
   */
  protected wastedNow(state: GameState, offer: LegalAction): boolean {
    if (temporaryEffectCanMatter(state, this.playerId)) return false;
    const effect = this.offerEffect(offer);
    return effect !== undefined && onlyUntilEndOfTurn(effect);
  }

  /**
   * Whether `offer` casts a creature that counters a spell as it enters
   * (`entersToCounter` — Transcendent Dragon, Mystic Snake) with no
   * opponent's spell on the stack: its trigger would have nothing to aim at
   * but our own spell, and the card is worth holding as an answer. v1 and
   * v2's search alike leave it in hand until an opponent casts something.
   */
  protected holdsForASpell(state: GameState, offer: LegalAction): boolean {
    if (offer.kind !== "cast-spell" || !this.registry.has(offer.cardName)) return false;
    if (!entersToCounter(this.registry.get(offer.cardName))) return false;
    return !state.zones.shared.stack.some((id) => {
      const object = state.objects[id];
      return object !== undefined && object.kind === "card" && object.controller !== this.playerId;
    });
  }

  /**
   * Whether `offer` is a board wipe to save for after combat: our own first
   * main phase, nothing on the stack, and among what it would take is a
   * creature of ours that could attack this turn. Cast now, that creature's
   * attack is lost; cast in the second main phase, it gets its attack in and
   * the wipe does the same afterwards. A one-sided wipe ("creatures you
   * don't control"), or one our attackers survive, is left alone: clearing
   * blockers first is the point of it. The search can't see this — its
   * rollouts never cast the held wipe later in the turn.
   */
  protected holdsWipeForCombat(state: GameState, offer: LegalAction): boolean {
    if (offer.kind !== "cast-spell") return false;
    if (state.zones.shared.stack.length > 0) return false;
    if (state.turn.step !== "precombat-main" || activePlayerOf(state) !== this.playerId) return false;
    const effect = this.offerEffect(offer);
    const sweeps = sweepsOf(effect);
    if (sweeps.length === 0) return false;
    const me = this.playerId;
    const opponents = state.turnOrder.filter((p) => p !== me && !state.players[p].hasLost);
    return state.zones.shared.battlefield.some((id) => {
      if (state.objects[id]?.controller !== me) return false;
      if (!opponents.some((p) => whyCannotAttack(state, this.registry, me, id, p) === null)) return false;
      const c = computeCharacteristics(state, this.registry, id);
      return sweeps.some((sweep) => {
        if (!matchesFilter(state, this.registry, id, sweep.filter, { you: me })) return false;
        if (sweep.kind === "destroy-all") return !c.keywords.has("indestructible");
        if (sweep.kind === "damage-all") {
          if (sweep.whose !== undefined && sweep.whose !== "each-player") return false;
          return typeof sweep.amount !== "number" || sweep.amount >= c.toughness - (state.objects[id]?.damageMarked ?? 0);
        }
        return true;
      });
    });
  }

  /**
   * Whether `offer` would spend mana in this bot's own upkeep or draw step,
   * with nothing on the stack — mana its main phase could have cast a spell
   * with. The search can't see that: its rollouts pass at every window, so
   * the main phase's spells never appear in them and the mana looks free. On
   * seed 50 v2 spent its upkeep on Hoard-Smelter Dragon and Scavenging Ooze
   * and cast nothing after. Mana spent on an opponent's turn untaps on ours,
   * so this is about our own turn only; an ability with an activation
   * condition (it may only be usable now) is left alone.
   */
  protected holdsManaForMain(state: GameState, offer: LegalAction): boolean {
    if (offer.kind !== "cast-spell" && offer.kind !== "activate-ability") return false;
    if (state.zones.shared.stack.length > 0) return false;
    if (state.turn.step !== "upkeep" && state.turn.step !== "draw") return false;
    if (activePlayerOf(state) !== this.playerId) return false;
    if (offer.kind === "activate-ability" && offer.manaAbility === true) return false;
    if (!this.registry.has(offer.cardName)) return false;
    const def = this.registry.get(offer.cardName);
    if (offer.kind === "cast-spell") {
      if (offer.free === true) return false;
      return def.manaCost !== null && manaValue(parseManaCost(def.manaCost)) > 0;
    }
    const ability = def.activated?.[offer.abilityIndex];
    if (ability === undefined || !offer.text.startsWith(ability.text)) return false;
    if (ability.condition !== undefined) return false;
    const mana = ability.cost.mana;
    return mana !== null && mana !== "" && mana !== "{0}";
  }

  /** The effect a cast or activation offer resolves with, or `undefined`
   * where it isn't read here: a granted ability, a modal or multi-face
   * spell, anything else. */
  protected offerEffect(offer: LegalAction): EffectSpec | null | undefined {
    if (offer.kind !== "cast-spell" && offer.kind !== "activate-ability") return undefined;
    if (!this.registry.has(offer.cardName)) return undefined;
    const def = this.registry.get(offer.cardName);
    if (offer.kind === "cast-spell") {
      if (offer.castModal !== undefined || offer.face !== undefined) return undefined;
      return def.effect;
    }
    const ability = def.activated?.[offer.abilityIndex];
    if (ability === undefined || !offer.text.startsWith(ability.text)) return undefined;
    return ability.effect;
  }

  /**
   * What activating `legal` is worth to this bot, or `null` to leave it
   * alone: its effect with the targets it would be aimed at
   * (`effect-worth.ts`), less the permanent a "sacrifice a creature" cost
   * gives up and any life it pays. An ability the registry can't read (a
   * granted one) is worth 0 — unknown, so still allowed, as before.
   *
   * v1 activated the first non-mana ability it found, whatever it did —
   * Viscera Seer's "Sacrifice a creature: Scry 1" four times a turn.
   */
  private activationWorth(state: GameState, legal: ActivateAbilityLegal): number | null {
    const ability = this.registry.has(legal.cardName)
      ? this.registry.get(legal.cardName).activated?.[legal.abilityIndex]
      : undefined;
    // A granted ability sits past the printed ones; the text says which (an
    // offer's text may carry an "(X=n)" after it).
    if (ability === undefined || !legal.text.startsWith(ability.text)) return 0;
    const targets = this.aimedTargets(
      state,
      legal.targetOptions,
      legal.targetSpecs,
      offerPolarities(this.registry, legal, polarityBias(state, this.playerId)),
    );
    let worth = effectWorth(ability.effect, {
      state,
      me: this.playerId,
      controller: this.playerId,
      targets: targets.map((t) => t ?? undefined),
      source: legal.source,
    });
    if (legal.sacrifice !== undefined) worth -= 2;
    if (ability.cost.payLife !== undefined) {
      if (ability.cost.payLife >= state.players[this.playerId].life) return null;
      worth += costWorth(state, this.playerId, { life: ability.cost.payLife });
    }
    return worth < 0 ? null : worth;
  }

  /**
   * One target per slot, aimed by what the slot's effect does to its target
   * (`target-polarity.ts`) — removal at the opponents' most valuable
   * permanent, a pump at our own best creature — where this used to take the
   * first legal option. `legalTargets` lists the players in turn order and
   * then the battlefield oldest-first, so "first" was this bot itself or its
   * own oldest permanent: it pacified its own creatures, Murdered its own
   * Bears and cast Negate on its own spells. Measured over 40 four-player
   * games, 22% of its targeted picks landed on the wrong side of the table;
   * aimed, about 1%, and a prototype of this benched 32.8% [28.3, 37.5]
   * against three unaimed copies at four players (even 25%).
   *
   * Slot by slot through `fillableOptions`, exactly as `firstOfEach` does, so
   * an "another target" slot still skips what an earlier one took. A slot the
   * polarity can't read keeps the first option, and an unknown source
   * (`polarities` null — a granted ability, a targeted modal spell) keeps
   * `firstOfEach` outright.
   */
  private aimedTargets(
    state: GameState,
    legalOptions: readonly (readonly TargetRef[])[],
    specs: readonly TargetSpec[],
    polarities: readonly Polarity[] | null,
  ): ChosenTargets {
    if (polarities === null) return firstOfEach(legalOptions, specs);
    const picked: (TargetRef | null)[] = [];
    const group = anyNumberSlot(specs);
    for (let i = 0; i < legalOptions.length; i += 1) {
      const polarity = polarities[i] ?? "either";
      const fillable = fillableOptions(specs, legalOptions, i, picked);
      const best = rankTargets(state, this.registry, this.playerId, fillable, polarity)[0];
      // An "any number of" group (always last) takes one member, or none,
      // as `firstOfEach` does.
      if (i === group) {
        if (best !== undefined) picked.push(best);
        break;
      }
      // "Up to one target creature" with only the wrong side to point at is
      // a choice to point at nothing.
      const skip =
        isOptionalSpec(specs[i]) &&
        onlyWrongSide(state, this.playerId, fillable, polarity, specs[i]);
      picked.push(skip ? null : (best ?? null));
    }
    return picked;
  }

  /**
   * Whether a cast or activation could only be aimed at the wrong side of the
   * table — a counterspell with only our own spell on the stack, a Murder
   * with only our own creatures to kill, a +1/+1 counter with only the
   * opponents' creatures to put it on. Such an offer is left alone rather
   * than cast at whatever's legal. A slot whose spec names the side ("target
   * creature you control") is the card's choice, not a mistake, and an
   * optional slot can always be left empty.
   */
  private aimsOnlyAtWrongSide(
    state: GameState,
    offer: CastSpellLegal | ActivateAbilityLegal,
  ): boolean {
    if (offer.kind === "cast-spell" && offer.castModal !== undefined) {
      return this.aimableModes(state, offer).length < offer.castModal.minModes;
    }
    if (offer.targetOptions.length === 0) return false;
    const polarities = offerPolarities(this.registry, offer, polarityBias(state, this.playerId));
    if (polarities === null) return false;
    return offer.targetOptions.some(
      (options, i) =>
        !isOptionalSpec(offer.targetSpecs[i]) &&
        onlyWrongSide(state, this.playerId, options, polarities[i] ?? "either", offer.targetSpecs[i]),
    );
  }

  /** The modes of a targeted modal spell that can be chosen and aimed at the
   * right side of the table: X damage "to target creature with flying" isn't
   * one when the only flyers are our own. */
  private aimableModes(state: GameState, legal: CastSpellLegal): number[] {
    const cm = legal.castModal;
    if (cm === undefined) return [];
    const byMode = modalPolarities(this.registry, legal, polarityBias(state, this.playerId));
    return cm.modes
      .map((_mode, i) => i)
      .filter((i) => cm.modes[i].targetOptions.every((options) => options.length > 0))
      .filter(
        (i) =>
          !cm.modes[i].targetOptions.some(
            (options, slot) =>
              !isOptionalSpec(cm.modes[i].targetSpecs[slot]) &&
              onlyWrongSide(
                state,
                this.playerId,
                options,
                byMode?.[i]?.[slot] ?? "either",
                cm.modes[i].targetSpecs[slot],
              ),
          ),
      );
  }

  /** Which modes of a targeted modal spell to choose: as many as allowed, in
   * order, of the aimable ones — or of every mode with a legal target, when
   * the aimable ones don't make the minimum. `null` when nothing does. */
  private usableModes(state: GameState, legal: CastSpellLegal): number[] | null {
    const cm = legal.castModal;
    if (cm === undefined) return null;
    const aimable = this.aimableModes(state, legal);
    const usable =
      aimable.length >= cm.minModes
        ? aimable
        : cm.modes
            .map((_mode, i) => i)
            .filter((i) => cm.modes[i].targetOptions.every((options) => options.length > 0));
    if (usable.length < cm.minModes) return null;
    return usable.slice(0, Math.max(cm.minModes, Math.min(cm.maxModes, usable.length)));
  }

  /** "You may cast [a card]": cast it — of several, the one of highest mana
   * value, which a free cast gets the most for — as the first of its
   * variants that builds into a cast, the same way this bot casts from
   * priority. */
  chooseCastNow(view: ControllerView, offer: CastNowOffer): CastSpellAction | null {
    const worth = (legal: CastSpellLegal): number => this.manaValueOf(legal.cardName);
    for (const legal of [...offer.casts].sort((a, b) => worth(b) - worth(a))) {
      const action = this.toCastSpell(view.state, legal);
      if (action.type === "cast-spell") return action;
    }
    return null;
  }

  /** A trigger's targets (or a free cast's), aimed the same way as a cast's. */
  chooseTargets(
    view: ControllerView,
    _sourceName: string,
    specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): ChosenTargets {
    return this.aimedTargets(
      view.state,
      legalOptions,
      specs,
      pendingTargetPolarities(view.state, this.registry, polarityBias(view.state, this.playerId)),
    );
  }

  /** What an Aura put onto the battlefield without being cast enchants (rule
   * 303.4f): the side its statics say — a Pacifism on an opponent's best
   * creature, a Rancor on our own. */
  chooseEnchant(view: ControllerView, source: ObjectId, options: readonly ObjectId[]): ObjectId {
    const name = view.state.objects[source]?.cardName;
    const polarity: Polarity =
      name !== undefined && this.registry.has(name) ? auraPolarity(this.registry.get(name)) : "either";
    const best = rankTargets(
      view.state,
      this.registry,
      this.playerId,
      options.map((object): TargetRef => ({ kind: "object", object })),
      polarity,
    )[0];
    return best?.kind === "object" ? best.object : options[0];
  }

  /**
   * What a Clone copies: the most valuable creature on the battlefield,
   * whoever's it is — except a legendary one we already control, which the
   * legend rule would make us choose between (rule 704.5j). The first option
   * used to be the oldest creature, very often a mana dork.
   */
  chooseCopy(view: ControllerView, _source: ObjectId, options: readonly ObjectId[]): ObjectId | null {
    const state = view.state;
    const ownLegend = (id: ObjectId): boolean => {
      const object = state.objects[id];
      if (object === undefined || object.controller !== this.playerId) return false;
      const name = printedCardName(object);
      return this.registry.has(name) && (this.registry.get(name).supertypes ?? []).includes("legendary");
    };
    const worth = options.filter((id) => !ownLegend(id));
    const best = rankTargets(
      state,
      this.registry,
      this.playerId,
      (worth.length > 0 ? worth : options).map((object): TargetRef => ({ kind: "object", object })),
      "take",
    )[0];
    return best?.kind === "object" ? best.object : null;
  }

  /** What to scry or surveil away: flood lands and spells far out of reach
   * (`scry-pick.ts`). v2's search can rarely see past the next draw, so its
   * ties come here too. */
  chooseScry(
    view: ControllerView,
    cards: readonly ObjectId[],
    mode: "scry" | "surveil",
  ): readonly ObjectId[] {
    return scryAway(view.state, this.registry, this.playerId, cards, mode);
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
    view: ControllerView,
    eligible: readonly ObjectId[],
    min: number,
    max: number,
  ): readonly ObjectId[] {
    // A land search takes a colour we can't make yet first (`land-colors.ts`).
    const ranked = newColorsFirst(view.state, this.registry, this.playerId, eligible);
    return ranked.slice(0, Math.max(min, Math.min(max, ranked.length)));
  }

  /**
   * A ward payment (rule 702.21a) is offered only when it's affordable, and
   * a spell of this bot's that targeted something is one it wanted to
   * resolve, so it pays — unless the life it would pay is all it has left.
   *
   * Everything else — a "you may", a punisher's "unless", a villainous
   * choice, a modal choice — is weighed by `effect-worth.ts`: each mode by
   * what it does to this bot (with the targets it already has, so a "may"
   * aimed at our own creature reads as the harm it is), less the choice's
   * cost; and declining by what happens instead. Declining wins a tie, so a
   * clause the worth can't read keeps v1's old do-nothing answer. v1 used to
   * decline every "you may", Rhystic Study's {1} included, and take a modal
   * choice's first modes whatever they were.
   */
  chooseModes(
    view: ControllerView,
    minModes: number,
    maxModes: number,
    modeTexts: readonly string[],
  ): readonly number[] {
    const state = view.state;
    const awaiting = state.awaiting;
    if (awaiting?.kind !== "choose-modes") {
      return super.chooseModes(view, minModes, maxModes, modeTexts);
    }
    if (awaiting.ward !== undefined) {
      const life = state.players[view.player].life;
      return lifePaidBy(awaiting.modes[0]?.effect) >= life ? [] : [0];
    }
    const context = {
      state,
      me: this.playerId,
      targets: awaiting.targets,
      source: awaiting.source,
      ...(awaiting.triggerObject !== undefined ? { triggerObject: awaiting.triggerObject } : {}),
      ...(awaiting.lastKnownRefs?.player !== undefined
        ? { triggerPlayer: awaiting.lastKnownRefs.player }
        : {}),
    };
    const cost = costWorth(state, this.playerId, {
      ...(awaiting.cost !== undefined ? { mana: awaiting.cost } : {}),
      ...(awaiting.costLife !== undefined ? { life: awaiting.costLife } : {}),
      ...(awaiting.costEnergy !== undefined ? { energy: awaiting.costEnergy } : {}),
    });
    const scored = awaiting.modes
      .map((mode, index) => ({
        index,
        worth: effectWorth(mode.effect, {
          ...context,
          controller: awaiting.modesController ?? awaiting.player,
        }),
      }))
      .sort((a, b) => b.worth - a.worth || a.index - b.index);
    // The fewest modes allowed, best first; then any more that are worth
    // having on their own.
    const chosen = scored.slice(0, minModes);
    for (const mode of scored.slice(minModes)) {
      if (chosen.length >= maxModes || mode.worth <= 0) break;
      chosen.push(mode);
    }
    if (minModes === 0) {
      const declined = effectWorth(awaiting.onDecline, {
        ...context,
        controller: awaiting.declineController ?? awaiting.player,
      });
      // Nothing worth having alone may still beat what declining lets
      // happen: paying the punisher's {1}.
      const best = scored[0];
      if (chosen.length === 0 && best !== undefined && maxModes > 0) chosen.push(best);
      const taken = chosen.reduce((sum, mode) => sum + mode.worth, 0) + cost;
      if (taken <= declined) return [];
    }
    return chosen.map((mode) => mode.index).sort((a, b) => a - b);
  }

  /** The cheapest of what may be sacrificed — see `cheapestPermanents`. */
  chooseSacrifices(
    view: ControllerView,
    eligible: readonly ObjectId[],
    count: number,
  ): readonly ObjectId[] {
    return this.cheapestPermanents(view.state, eligible, count);
  }

  /** Surplus lands first, then what the board can't cast soon — see
   * `chooseBottomOfHand`. v1 used to discard from the front of its hand. */
  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
    view?: ControllerView,
  ): readonly ObjectId[] {
    const lands =
      view === undefined
        ? 0
        : view.state.zones.shared.battlefield.filter(
            (id) =>
              view.state.objects[id]?.controller === this.playerId &&
              computeCharacteristics(view.state, this.registry, id).types.includes("land"),
          ).length;
    return chooseBottomOfHand(hand, this.registry, count, lands);
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

  /** Whether casting `legal` would pay a life-paid commander tax (Liesa,
   * Shroud of Dusk) down to 0 or below. The cast is legal (rule 119.4 lets
   * life be paid down to exactly 0), so `legalActions` offers it, but paying
   * it means losing at the next state-based check. */
  private taxWouldKill(state: GameState, legal: CastSpellLegal): boolean {
    const object = state.objects[legal.card];
    if (object === undefined || object.zone !== "command") return false;
    if (!this.registry.get(object.cardName).commanderTaxAsLife) return false;
    const player = state.players[this.playerId];
    const tax = 2 * (player.commanderCastCounts[object.cardName] ?? 0);
    return tax > 0 && player.life - tax <= 0;
  }

  act(view: ControllerView): Action {
    const awaited = answerAwaited(this, view);
    if (awaited !== null) return awaited;

    const player = this.playerId;
    const options = view.legalActions();

    const lands = options.filter((o): o is PlayLandLegal => o.kind === "play-land");
    if (lands.length > 0) return this.toPlayLand(this.bestLand(view, lands));

    const fetch = options.find(
      (o): o is ActivateAbilityLegal =>
        o.kind === "activate-ability" && this.isFreeFetch(view.state, o.source, o.abilityIndex),
    );
    if (fetch !== undefined) return this.toActivateAbility(view.state, fetch);

    const spells = options.filter(
      (o): o is CastSpellLegal =>
        o.kind === "cast-spell" &&
        !this.taxWouldKill(view.state, o) &&
        !this.aimsOnlyAtWrongSide(view.state, o) &&
        !this.wastedNow(view.state, o) &&
        !this.holdsForASpell(view.state, o) &&
        !this.holdsWipeForCombat(view.state, o) &&
        !this.holdsManaForMain(view.state, o),
    );
    if (spells.length > 0) {
      const best = spells.reduce((a, b) =>
        this.manaValueOf(b.cardName) > this.manaValueOf(a.cardName) ? b : a,
      );
      return this.toCastSpell(view.state, best);
    }

    if (view.state.turn.number !== this.activationTurn) {
      this.activationTurn = view.state.turn.number;
      this.activations.clear();
    }
    // The ability worth most (`activationWorth`), the first of a tie.
    let ability: ActivateAbilityLegal | undefined;
    let abilityWorth = -Infinity;
    for (const o of options) {
      if (
        o.kind !== "activate-ability" ||
        this.isManaOnlyAbility(o) ||
        this.isPointlessReattach(view.state, o) ||
        (this.activations.get(`${o.source}:${o.abilityIndex}`) ?? 0) >= MAX_ACTIVATIONS_PER_TURN ||
        this.aimsOnlyAtWrongSide(view.state, o) ||
        this.wastedNow(view.state, o) ||
        this.holdsManaForMain(view.state, o)
      ) {
        continue;
      }
      const worth = this.activationWorth(view.state, o);
      if (worth !== null && worth > abilityWorth) {
        ability = o;
        abilityWorth = worth;
      }
    }
    if (ability !== undefined) {
      const key = `${ability.source}:${ability.abilityIndex}`;
      this.activations.set(key, (this.activations.get(key) ?? 0) + 1);
      return this.toActivateAbility(view.state, ability);
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
    // must attack a player other than its goader when it can (rule 701.15b),
    // and a creature under Vow of Duty can't attack the Vow's controller.
    // One shared target for everyone is rejected by `dispatch` the moment
    // either applies.
    // Combat damage, not power: a 0/4 wall under Arcades, the Strategist
    // deals 4.
    return legal.eligible
      .filter((id) => assignedCombatDamage(state, this.registry, id) > 0)
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
      return combatDamageOf(it) >= me.toughness || it.keywords.has("deathtouch");
    });
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    const legal = view
      .legalActions()
      .find((o): o is DeclareBlockersLegal => o.kind === "declare-blockers");
    if (legal === undefined) return [];
    const state = view.state;
    // What each creature deals in combat (its power, or its toughness under
    // Doran, the Siege Tower) — the only "power" a block is judged on.
    const power = (id: ObjectId) => assignedCombatDamage(state, this.registry, id);
    const toughness = (id: ObjectId) => computeCharacteristics(state, this.registry, id).toughness;

    const chosen = new Map<ObjectId, ObjectId>(); // blocker -> attacker
    const used = new Set<ObjectId>();

    // Lure (rule 509.1c): a creature able to block a must-be-blocked
    // attacker must block one of them. One with menace forces blocks only in
    // pairs, which `obeyingLure` sorts out at the end.
    for (const entry of legal.eligible) {
      const mustOptions = entry.canBlock.filter(
        (a) => legal.mustBlock.includes(a) && !legal.menaceAttackers.includes(a),
      );
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
    return obeyingLure(blocks, legal);
  }
}

type Sweep = Extract<
  EffectSpec,
  { readonly kind: "destroy-all" | "damage-all" | "exile-all" | "return-to-hand-all" }
>;

/** The mass removal in `effect` — destroy, damage, exile or bounce "all"
 * — through sequences and "may"s. */
function sweepsOf(effect: EffectSpec | null | undefined): Sweep[] {
  if (effect === null || effect === undefined) return [];
  switch (effect.kind) {
    case "destroy-all":
    case "damage-all":
    case "exile-all":
    case "return-to-hand-all":
      return [effect];
    case "sequence":
      return effect.effects.flatMap(sweepsOf);
    case "may":
      return sweepsOf(effect.effect);
    default:
      return [];
  }
}

/**
 * Whether an effect is good or bad **for one player** — what a bot needs to
 * answer "you may", a punisher's "unless", a villainous choice or a modal
 * choice without searching it.
 *
 * `target-polarity.ts` says which side of the table a *target* belongs on
 * before it's chosen. This is its other half: once the targets are chosen (or
 * where there are none), how much doing the effect is worth to `me`, as a
 * coarse signed number — a card about 2, a point of life a quarter of one
 * until life runs low, removal of one permanent 4. It is not the evaluation
 * and doesn't try to be: v2 searches every decision this answers and keeps
 * this answer only when nothing beats it. What it has to get right is the
 * sign, and the order between a cost and what the cost buys — paying {1} to
 * stop an opponent drawing, sacrificing a land rather than The Gitrog
 * Monster, declining a "you may" whose chosen target turned out to be ours.
 *
 * Targeted parts are read through `slotStrengths` against the targets the
 * effect actually has, so a "may" aimed at our own creature reads as the harm
 * it is. Untargeted parts are read off the effect's player scope ("you",
 * "each opponent") for the handful of kinds that make up nearly every
 * optional clause in the pool — draws, life, discards, sacrifices, tokens,
 * tutors, recursion. Anything else is worth 0: unknown, not bad, so it never
 * outweighs a cost that is known.
 *
 * Something done to an opponent counts, like the evaluation's
 * `otherOpponents`, split across the opponents: one opponent drawing a card
 * costs a four-player bot a third of what its own draw is worth.
 *
 * Pure over a `GameState`, with no `bot/` import, so decision modules and v1
 * may both use it.
 */

import type { EffectAmount, EffectSpec, EffectTargetRef, PlayerScope } from "./effects.js";
import { manaValue, parseManaCost } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";
import { activePlayerOf } from "./state.js";
import type { ResolvedTargets } from "./target.js";
import { sideOf, slotStrengths } from "./target-polarity.js";

/** What one card is worth, the unit everything else is scaled to. */
const CARD = 2;
/** Removing a permanent (the decisive effects), a card's effect (major), a
 * tap or a small pump (minor) — `slotStrengths`' three weights. */
const SLOT_WORTH: readonly number[] = [1, CARD, 4];
/** A point of life with life to spare, and below `LIFE_DANGER_AT` — the same
 * bend as the evaluation's `life` and `lifeDanger` (0.5 and 1.5 per point
 * against its card's 1). */
const LIFE_POINT = 0.25;
const LIFE_POINT_IN_DANGER = 0.75;
const LIFE_DANGER_AT = 15;
/** Mana spent on a choice, per point of mana value. */
const MANA_POINT = 0.5;
/** Counters that are bad to have (`target-polarity.ts`' list). */
const HARMFUL_COUNTERS: ReadonlySet<string> = new Set(["-1/-1", "blight", "flood", "stun"]);

export interface WorthContext {
  readonly state: GameState;
  /** Whose point of view the worth is from. */
  readonly me: PlayerId;
  /** Whose effect it is — "you" in its text. */
  readonly controller: PlayerId;
  /** The targets it has (a `choose-modes` decision's own `targets`). */
  readonly targets: ResolvedTargets;
  /** Its source and triggering object, for `"source"`/`"trigger-object"`. */
  readonly source?: ObjectId;
  readonly triggerObject?: ObjectId;
  /** "That player" of the trigger, if it names one. */
  readonly triggerPlayer?: PlayerId;
}

/** A plain number of an amount, or `fallback` for a live one. */
function sizeOf(amount: EffectAmount | undefined, fallback = 1): number {
  return typeof amount === "number" ? Math.max(0, amount) : fallback;
}

function opponentsOf(state: GameState, player: PlayerId): PlayerId[] {
  return state.turnOrder.filter((p) => p !== player && !state.players[p].hasLost);
}

/** The players a scope reaches, or `null` when it can't be told here. */
function playersIn(scope: PlayerScope, ctx: WorthContext): readonly PlayerId[] | null {
  const { state, controller } = ctx;
  switch (scope) {
    case "you":
      return [controller];
    case "each-opponent":
      return opponentsOf(state, controller);
    case "each-player":
      return state.turnOrder.filter((p) => !state.players[p].hasLost);
    case "active-player":
      return [activePlayerOf(state)];
    case "trigger-player":
    case "that-player":
      return ctx.triggerPlayer !== undefined ? [ctx.triggerPlayer] : null;
    case "each-other-opponent":
      return opponentsOf(state, controller).filter((p) => p !== ctx.triggerPlayer);
    case "trigger-controller": {
      const object = ctx.triggerObject !== undefined ? state.objects[ctx.triggerObject] : undefined;
      return object !== undefined ? [object.controller] : null;
    }
  }
}

/** `worth` done to each of `players`, from `me`'s seat: all of it if it's
 * `me`, the negation shared across the opponents otherwise. */
function onPlayers(players: readonly PlayerId[] | null, worth: number, ctx: WorthContext): number {
  if (players === null) return 0;
  const opponents = Math.max(1, opponentsOf(ctx.state, ctx.me).length);
  let total = 0;
  for (const p of players) total += p === ctx.me ? worth : -worth / opponents;
  return total;
}

/** A player losing `amount` life, as a (negative) worth to them. */
function lifeLoss(state: GameState, player: PlayerId, amount: number): number {
  const life = state.players[player]?.life ?? 0;
  const safe = Math.max(0, Math.min(amount, life - LIFE_DANGER_AT));
  return -(safe * LIFE_POINT + (amount - safe) * LIFE_POINT_IN_DANGER);
}

/** Life lost by each of `players`, from `me`'s seat. */
function lifeLossTo(players: readonly PlayerId[] | null, amount: number, ctx: WorthContext): number {
  if (players === null) return 0;
  const opponents = Math.max(1, opponentsOf(ctx.state, ctx.me).length);
  let total = 0;
  for (const p of players) {
    const loss = lifeLoss(ctx.state, p, amount);
    total += p === ctx.me ? loss : -loss / opponents;
  }
  return total;
}

/** The permanent a `"source"`/`"trigger-object"` reference names. */
function objectRef(ref: EffectTargetRef, ctx: WorthContext): ObjectId | undefined {
  if (ref === "source") return ctx.source;
  if (ref === "trigger-object") return ctx.triggerObject;
  return undefined;
}

/** Something good (`worth` > 0) or bad done to a permanent named by
 * `"source"`/`"trigger-object"`, counted for whoever controls it. Numbered
 * slots are the targets, already counted. */
function onObjectRef(ref: EffectTargetRef, worth: number, ctx: WorthContext): number {
  const id = objectRef(ref, ctx);
  const object = id !== undefined ? ctx.state.objects[id] : undefined;
  if (object === undefined) return 0;
  return onPlayers([object.controller], worth, ctx);
}

/** The worth of the effect's targets as chosen: each slot's deciding effect
 * done to whichever side its target is on. */
function targetsWorth(effect: EffectSpec, ctx: WorthContext): number {
  const strengths = slotStrengths(effect, ctx.targets.length);
  const opponents = Math.max(1, opponentsOf(ctx.state, ctx.me).length);
  let total = 0;
  strengths.forEach((strength, slot) => {
    const target = ctx.targets[slot];
    if (strength === null || target === undefined) return;
    // Harm to a card in a graveyard or exile is a nibble, not removal:
    // exiling one card from a graveyard reads as `exile`, which is decisive
    // for a permanent. (Taking a card from there — reanimation — isn't harm.)
    const zone = target.kind === "object" ? ctx.state.objects[target.object]?.zone : undefined;
    const offBoard = zone !== undefined && zone !== "battlefield" && zone !== "stack";
    const weight = offBoard && strength.polarity === "harm" ? 0 : strength.weight;
    const worth = SLOT_WORTH[weight];
    const side = sideOf(ctx.state, target, ctx.me);
    if (side === null) return;
    switch (strength.polarity) {
      case "take":
        total += worth;
        break;
      case "help":
        total += side === "own" ? worth : -worth / opponents;
        break;
      case "harm":
        total += side === "own" ? -worth : worth / opponents;
        break;
      case "either":
        break;
    }
  });
  return total;
}

/** The untargeted parts: see the module comment for which kinds are read. */
function untargetedWorth(effect: EffectSpec, ctx: WorthContext): number {
  const you = [ctx.controller];
  switch (effect.kind) {
    case "sequence":
      return effect.effects.reduce((sum, e) => sum + untargetedWorth(e, ctx), 0);
    case "for-each-target":
    case "for-target":
    case "delayed-trigger":
      return untargetedWorth(effect.effect, ctx);
    case "conditional":
      return untargetedWorth(effect.then, ctx);
    case "may":
      return (
        untargetedWorth(effect.effect, ctx) +
        (effect.then !== undefined ? untargetedWorth(effect.then, ctx) : 0)
      );
    case "draw": {
      if (typeof effect.target === "number") return 0;
      const n = sizeOf(effect.amount);
      const players = playersIn(effect.who ?? "you", ctx);
      // Drawing from a library too small to draw from loses the game.
      const decking = (players ?? []).includes(ctx.me) &&
        ctx.state.zones.perPlayer[ctx.me].library.length < n;
      return decking ? -100 : onPlayers(players, CARD * n, ctx);
    }
    case "gain-life":
      if (effect.toControllerOfTarget !== undefined) return 0;
      return onPlayers(playersIn(effect.who ?? "you", ctx), LIFE_POINT * sizeOf(effect.amount, 2), ctx);
    case "lose-life":
      if (effect.target !== undefined || effect.toControllerOfTarget !== undefined) return 0;
      return lifeLossTo(playersIn(effect.who ?? "you", ctx), sizeOf(effect.amount, 2), ctx);
    case "damage":
      if (effect.target !== undefined || effect.who === undefined) return 0;
      return lifeLossTo(playersIn(effect.who, ctx), sizeOf(effect.amount, 2), ctx);
    case "discard":
      if (typeof effect.target === "number") return 0;
      return onPlayers(playersIn(effect.target, ctx), -CARD * sizeOf(effect.amount), ctx);
    case "sacrifice":
      if (effect.who === "target") return 0;
      return onPlayers(playersIn(effect.who, ctx), -CARD * effect.count, ctx);
    case "sacrifice-source":
      return (
        onObjectRef("source", -CARD, ctx) +
        (effect.then !== undefined ? untargetedWorth(effect.then, ctx) : 0)
      );
    case "create-token": {
      if (effect.who === "target-controller") return 0;
      const players = playersIn(effect.who ?? "you", ctx);
      return onPlayers(players, 1.5 * sizeOf(effect.count), ctx);
    }
    case "search-library":
      if (effect.who !== undefined) return 0;
      return onPlayers(you, effect.destination === "graveyard" ? 0.5 : CARD, ctx);
    case "look-and-choose":
      return onPlayers(you, effect.destination === "library-top" ? 0.5 : 1.5, ctx);
    case "return-from-graveyard":
      return onPlayers(you, CARD * (effect.count === "all" ? 2 : effect.count), ctx);
    case "put-onto-battlefield":
      return typeof effect.target === "number" ? 0 : onObjectRef(effect.target, CARD, ctx);
    case "add-mana":
      return onPlayers(you, 0.5, ctx);
    case "scry":
    case "surveil":
      return (
        onPlayers(you, 0.5, ctx) + (effect.then !== undefined ? untargetedWorth(effect.then, ctx) : 0)
      );
    case "untap":
      return typeof effect.target === "number" ? 0 : onObjectRef(effect.target, 0.5, ctx);
    case "connive":
      if (typeof effect.target === "number") return 0;
      return onObjectRef(effect.target, 0.5, ctx);
    case "add-counter":
      if (typeof effect.target === "number") return 0;
      return onObjectRef(effect.target, HARMFUL_COUNTERS.has(effect.counter) ? -1 : 1, ctx);
    case "modify-pt": {
      if (typeof effect.target === "number") return 0;
      const signOf = (a: EffectAmount): number => (typeof a === "number" ? Math.sign(a) : 1);
      const sign = signOf(effect.toughness) || signOf(effect.power);
      return onObjectRef(effect.target, sign, ctx);
    }
    case "take-extra-turn":
      return effect.target === undefined ? onPlayers(you, 3 * CARD, ctx) : 0;
    case "cascade":
      // Taking cascade's free spell: about a card, like a tutor to hand.
      return effect.finish?.cast === true ? onPlayers(you, CARD, ctx) : 0;
    default:
      return 0;
  }
}

/** What doing `effect` is worth to `ctx.me` — see the module comment. */
export function effectWorth(effect: EffectSpec | null | undefined, ctx: WorthContext): number {
  if (effect === null || effect === undefined) return 0;
  return targetsWorth(effect, ctx) + untargetedWorth(effect, ctx);
}

/** What paying a choice's cost is worth to `payer` (never positive): its mana
 * value in mana, its life as life, its energy a little. */
export function costWorth(
  state: GameState,
  payer: PlayerId,
  cost: { readonly mana?: string; readonly life?: number; readonly energy?: number },
): number {
  const mana = cost.mana !== undefined ? manaValue(parseManaCost(cost.mana)) : 0;
  const life = cost.life !== undefined && cost.life > 0 ? lifeLoss(state, payer, cost.life) : 0;
  return -MANA_POINT * mana + life - 0.25 * (cost.energy ?? 0);
}

/** Whether every part of `effect` lasts only until end of turn — a pump, a
 * keyword grant, an animation — so that it does nothing once the turn is
 * over. Anything else (a draw, a counter, a lasting pump) is `false`. */
export function onlyUntilEndOfTurn(effect: EffectSpec | null | undefined): boolean {
  if (effect === null || effect === undefined) return false;
  switch (effect.kind) {
    case "sequence":
      return effect.effects.length > 0 && effect.effects.every(onlyUntilEndOfTurn);
    case "modify-pt":
    case "modify-pt-all":
    case "grant-keyword":
    case "grant-keyword-all":
    case "animate":
      return effect.duration === "end-of-turn";
    default:
      return false;
  }
}

/** Combat, any player's: where an until-end-of-turn pump changes damage or
 * a block. */
const COMBAT_STEPS: ReadonlySet<string> = new Set([
  "begin-combat",
  "declare-attackers",
  "declare-blockers",
  "combat-damage",
]);

/**
 * Whether an until-end-of-turn effect used now could matter to `me`: in
 * combat, in my own first main phase (a pump or an animation that sets up an
 * attack), or in answer to something on the stack. Anywhere else it's gone
 * before it does anything — and the mana it costs is mana not spent on a
 * spell. On seed 50 v2 spent every land and Treasure in its upkeep on Lathliss,
 * Dragon Queen's "+1/+0 until end of turn" and cast nothing that turn: its
 * rollout plays its own seat passively, so mana it would have cast spells
 * with looked free.
 */
export function temporaryEffectCanMatter(state: GameState, me: PlayerId): boolean {
  if (state.zones.shared.stack.length > 0) return true;
  if (COMBAT_STEPS.has(state.turn.step)) return true;
  return state.turn.step === "precombat-main" && activePlayerOf(state) === me;
}

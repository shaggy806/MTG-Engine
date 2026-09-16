/**
 * The bot's position evaluation: one `GameState` in, one number out, from a
 * single seat's point of view. Higher is better for `me`.
 *
 * It's a weighted sum of per-player features, scored as *yours minus the best
 * opponent's* — a wrath that costs you two creatures and an opponent six is a
 * gain, and only a relative score can see that.
 *
 * ## Why the feature list is longer than it looks like it needs to be
 *
 * The obvious vector — life, cards in hand, creatures, power — makes the bot
 * catatonic, and measurably so: a land drop under those features is one fewer
 * card in hand and *nothing else*, so it scores strictly negative and a bot
 * that acts on improvement never plays a land, never casts a spell, and
 * passes every window. It loses every game without taking a single action.
 *
 * Every resource an action can convert a card *into* therefore needs a term,
 * or that action is invisible: `lands` for a land drop and for ramp,
 * `permanents` for artifacts/enchantments/equipment, `library` for milling
 * and deck-out. See `docs/plans/smarter-bots.md` for the numbers.
 */

import { computeCharacteristics } from "../characteristics.js";
import type { CardRegistry } from "../cards.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

/**
 * Per-feature multipliers. Tuned offline against a fixed benchmark opponent
 * (`engine/scripts/tune-bot.mjs`); these are a starting point, not a result.
 *
 * The weights are genuinely load-bearing rather than decoration — `lands`
 * alone moved a 30-game match from 2W-28L to 16W-14L purely by crossing the
 * threshold where a land drop outweighs the card it cost.
 */
export interface EvalWeights {
  readonly life: number;
  readonly hand: number;
  readonly creatures: number;
  readonly power: number;
  readonly toughness: number;
  readonly lands: number;
  readonly permanents: number;
  readonly library: number;
  /** How much the strongest opponent's score subtracts from yours. */
  readonly opponent: number;
}

export const DEFAULT_WEIGHTS: EvalWeights = {
  life: 1,
  hand: 2,
  creatures: 2,
  power: 1.5,
  toughness: 0.5,
  lands: 4,
  permanents: 0.5,
  library: 0.05,
  opponent: 1,
};

/** A decisive result dwarfs every positional term, so a lethal line always
 * beats a merely good one. */
const WIN = 1e6;

/** Someone who has already lost contributes nothing an opponent needs to fear. */
const DEAD = -1e4;

function scorePlayer(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  weights: EvalWeights,
): number {
  const p = state.players[player];
  if (p === undefined || p.hasLost) return DEAD;
  const zones = state.zones.perPlayer[player];

  let creatures = 0;
  let power = 0;
  let toughness = 0;
  let lands = 0;
  let permanents = 0;

  for (const id of state.zones.shared.battlefield) {
    const object = state.objects[id];
    if (object === undefined || object.controller !== player) continue;
    // One object can stand in for many token copies — see "Token stacking" in
    // CLAUDE.md. A stack of twenty Saprolings is twenty creatures, not one.
    const n = object.stackCount ?? 1;
    permanents += n;
    const c = computeCharacteristics(state, registry, id);
    if (c.types.includes("creature")) {
      creatures += n;
      power += c.power * n;
      toughness += c.toughness * n;
    }
    if (c.types.includes("land")) lands += n;
  }

  return (
    weights.life * p.life +
    weights.hand * zones.hand.length +
    weights.creatures * creatures +
    weights.power * power +
    weights.toughness * toughness +
    weights.lands * lands +
    weights.permanents * permanents +
    weights.library * zones.library.length
  );
}

/** Score `state` from `me`'s seat: my position minus my strongest opponent's. */
export function evaluateState(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  weights: EvalWeights = DEFAULT_WEIGHTS,
): number {
  if (state.result.over) return state.result.winner === me ? WIN : -WIN;

  const mine = scorePlayer(state, registry, me, weights);
  let best = 0;
  let seen = false;
  for (const player of state.turnOrder) {
    if (player === me) continue;
    const score = scorePlayer(state, registry, player, weights);
    if (!seen || score > best) {
      best = score;
      seen = true;
    }
  }
  return mine - weights.opponent * (seen ? best : 0);
}

/**
 * The bot's position evaluation: one `GameState` in, one number out, from a
 * single seat's point of view. Higher is better for `me`.
 *
 * It's a weighted sum of per-player features, scored as *yours minus your
 * opponents'* — a wrath that costs you two creatures and an opponent six is a
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
 * or that action is invisible — and every way of losing (life, commander
 * damage, decking) needs one too, or the bot can't see it coming. See
 * `docs/plans/smarter-bots.md` for the numbers.
 *
 * ## Conventions
 *
 * Every weight is positive, so the tuner's multiplicative mutation can't flip
 * a term's meaning. A feature that is a *cost* (commander damage taken,
 * commander tax) is subtracted rather than carrying a negative weight.
 *
 * Features are computed at the end of a simulated turn (see `simulate.ts`),
 * which decides what's worth measuring: summoning sickness always wears off
 * before the creature's controller could next attack, so it isn't a term, but
 * whether a creature is left *untapped* — able to block on the turns in
 * between — is.
 */

import type { CardRegistry } from "../cards.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { FEATURE_KEYS, featureSign, playerFeatures } from "./features.js";
import type { PlayerFeatures } from "./features.js";

/**
 * Per-feature multipliers. Tuned offline against a gauntlet of opponents
 * (`engine/scripts/tune-bot.mjs`); these are a starting point, not a result.
 *
 * The weights are genuinely load-bearing rather than decoration — `lands`
 * alone moved a 30-game match from 2W-28L to 16W-14L purely by crossing the
 * threshold where a land drop outweighs the card it cost.
 */
export interface EvalWeights {
  readonly life: number;
  /** Subtracted: the most combat damage taken from any one commander — 21
   * of it loses the game however much life is left (rule 903.10a). */
  readonly commanderDamage: number;
  /** Cards in hand, whatever they are. Public for every player. */
  readonly hand: number;
  /** Total mana value of the nonland cards in *your own* hand — what the hand
   * actually holds. Hidden information for an opponent, so only ever scored
   * for `me`; see "Known: the bot cheats" in the plan for why that matters. */
  readonly handManaValue: number;
  readonly creatures: number;
  readonly power: number;
  readonly toughness: number;
  /** Power that's hard to block: flying, menace, trample, fear, intimidate,
   * unblockable. */
  readonly evasivePower: number;
  /** Combat and protection keywords on creatures (first strike, double
   * strike, deathtouch, lifelink, vigilance, indestructible, hexproof,
   * shroud), one per keyword per creature. */
  readonly combatKeywords: number;
  /** Creatures left untapped and able to block. */
  readonly untappedCreatures: number;
  /** Lands up to `landCap`. */
  readonly lands: number;
  /** Where lands stop paying full value — the 12th land is worth less than
   * the 4th. Not a multiplier: a threshold the tuner moves like a weight. */
  readonly landCap: number;
  /** Lands beyond `landCap`. */
  readonly extraLands: number;
  /** Untapped permanents with a printed `{T}` mana ability — mana held up for
   * instant-speed plays on an opponent's turn. */
  readonly untappedMana: number;
  /** Permanents that are neither lands nor creatures. */
  readonly otherPermanents: number;
  /** Total mana value of nonland permanents — a Sol Ring and a six-drop
   * enchantment aren't the same one permanent. */
  readonly permanentManaValue: number;
  /** Loyalty on planeswalkers. */
  readonly loyalty: number;
  /** Counters other than +1/+1 and -1/-1 (already in P/T), loyalty (above),
   * and the bookkeeping kinds lore and time — charge, oil, experience… */
  readonly counters: number;
  readonly library: number;
  readonly graveyard: number;
  /** Graveyard cards that can be cast or activated from there: flashback
   * (printed or granted), escape, disturb, graveyard-zone abilities. */
  readonly graveyardCastable: number;
  readonly energy: number;
  /** Being the monarch — a card every end step until someone takes it. */
  readonly monarch: number;
  readonly emblems: number;
  /** Subtracted: commander casts from the command zone so far, each of which
   * makes the next cast {2} dearer (rule 903.8). */
  readonly commanderTax: number;
  /** How much the strongest opponent's score subtracts from yours. */
  readonly opponent: number;
  /** How much the *average* of every other living opponent subtracts. Zero
   * at a two-player table, where there's no one else. */
  readonly otherOpponents: number;
  /**
   * Not evaluation terms: the attack builder's crackback check
   * (`combat-math.ts`). How much of each opponent's all-out swing to expect
   * at us, beyond the next player's, which always counts in full — 1 means
   * everyone attacks us, 0 ignores all but the next player.
   */
  readonly crackbackParanoia: number;
  /** Life kept in reserve against crackback: an attack is unsafe once what
   * could come back gets within this much of lethal. Stands in for the
   * tricks, hasty creatures and removal the arithmetic doesn't model. */
  readonly crackbackMargin: number;
}

export const DEFAULT_WEIGHTS: EvalWeights = {
  life: 1,
  commanderDamage: 2,
  hand: 2,
  // Off to start, like `untappedMana` below. Each reads as a cost the moment a
  // card or mana is *spent*: casting a sorcery gives up its hand value with
  // nothing on the board to show for it. At 0.3 and 0.1 alongside the land
  // cap they cost 8 points of win rate at four players (36% -> 28%, see the
  // plan's Phase 1 notes). The tuner can switch either back on.
  handManaValue: 0,
  // `creatures` and `lands` absorb what the old catch-all `permanents` term
  // (0.5) gave them, so the first measurement of the new vector starts from
  // the same valuation of a creature and a land drop.
  creatures: 2.5,
  power: 1.5,
  toughness: 0.5,
  evasivePower: 0.5,
  combatKeywords: 0.5,
  untappedCreatures: 0.5,
  lands: 4.5,
  landCap: 7,
  // Must stay above `hand`: a land drop moves a card from hand to the
  // battlefield, so below it every land past the cap scores as a loss and the
  // bot stops making land drops in exactly the long games that need them.
  extraLands: 2.5,
  untappedMana: 0,
  otherPermanents: 0.5,
  permanentManaValue: 0.5,
  loyalty: 1,
  counters: 0.5,
  library: 0.05,
  graveyard: 0.05,
  graveyardCastable: 1,
  energy: 0.3,
  monarch: 3,
  emblems: 3,
  commanderTax: 0.5,
  opponent: 1,
  otherOpponents: 0.25,
  crackbackParanoia: 0.5,
  crackbackMargin: 2,
};

/** A decisive result dwarfs every positional term, so a lethal line always
 * beats a merely good one. */
const WIN = 1e6;

/** A drawn game (rule 104.4a) is better than losing and worse than winning —
 * and an even position scores zero, since the score is relative. */
const DRAW = 0;

/** Someone who has already lost contributes nothing an opponent needs to fear. */
const DEAD = -1e4;

/** The weighted sum of one player's features, signs folded in — the only place
 * an `EvalWeights` and a `PlayerFeatures` meet. */
export function scoreFeatures(features: PlayerFeatures, weights: EvalWeights): number {
  let total = 0;
  for (const key of FEATURE_KEYS) total += weights[key] * featureSign(key) * features[key];
  return total;
}

function scorePlayer(
  state: GameState,
  registry: CardRegistry,
  player: PlayerId,
  weights: EvalWeights,
  isMe: boolean,
): number {
  const p = state.players[player];
  if (p === undefined || p.hasLost) return DEAD;
  return scoreFeatures(playerFeatures(state, registry, player, isMe, weights.landCap), weights);
}

/**
 * Score `state` from `me`'s seat: my position, minus my strongest opponent's,
 * minus a smaller share of the average of everyone else still in the game.
 *
 * Only the strongest opponent used to count, which made a four-player bot
 * indifferent to everyone but the leader — happy to feed the second-best
 * player a whole board as long as the leader stayed put.
 */
export function evaluateState(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  weights: EvalWeights = DEFAULT_WEIGHTS,
): number {
  if (state.result.over) {
    if (state.result.winner === null) return DRAW;
    return state.result.winner === me ? WIN : -WIN;
  }

  const mine = scorePlayer(state, registry, me, weights, true);
  const theirs = state.turnOrder
    .filter((player) => player !== me && !state.players[player].hasLost)
    .map((player) => scorePlayer(state, registry, player, weights, false))
    .sort((a, b) => b - a);
  if (theirs.length === 0) return mine;

  const [strongest, ...rest] = theirs;
  const others = rest.length > 0 ? rest.reduce((a, b) => a + b, 0) / rest.length : 0;
  return mine - weights.opponent * strongest - weights.otherOpponents * others;
}

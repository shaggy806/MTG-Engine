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
  /**
   * Subtracted: how far below `LIFE_DANGER_AT` this player's life has fallen —
   * the bend that linear `life` structurally cannot make. See the constant in
   * `features.ts` for why it's a separate additive term rather than a
   * transform of `life`; at 0 the evaluation is exactly what it was before it
   * existed.
   */
  readonly lifeDanger: number;
  /** Subtracted: the most combat damage taken from any one commander — 21
   * of it loses the game however much life is left (rule 903.10a) — or the
   * player's poison counters on the same scale, whichever is nearer a loss
   * (ten poison is 21). */
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
  /** Subtracted: how far below `LIBRARY_DANGER_AT` this library has fallen.
   * The mirror of `lifeDanger`, and for the same reason — drawing from an
   * empty library loses the game (rule 104.3c), which linear `library` prices
   * the same as losing a card off the top of a full one. */
  readonly libraryDanger: number;
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
  // Starts at 0 so this ships as a strict no-op, to be swept the way `power`
  // was (four players, 200 games a value, against the mixed pod) rather than
  // guessed at. A nonzero value here is the only thing that makes losing five
  // life at 8 score worse than losing five at 40.
  lifeDanger: 0,
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
  // Swept at **four players** — the format — 200 games per value against the
  // same mixed pod: 1.5 scored 18.2%, 1.0 22.6%, 0.75 23.1%, 0.5 **24.0%**,
  // 0.25 23.1%, against an even share of 25%. A clean peak at 0.5, worth +5.8
  // points over the 1.5 this shipped with since Phase 1, and cheaper per game.
  //
  // Two other things had been saying so for a while. `bot:audit --rollout`
  // priced a vanilla Craw Wurm at 31.50 against a Sol Ring's 9.00, which is
  // this weight at 1.5 doing exactly that. And `ramp`, the hand-written style
  // that beat every tuned vector, halves it. The only source that disagreed was
  // the position fit, which raised it to 2.03 — and a big board predicts
  // winning without being caused by valuing power highly.
  //
  // It hid for so long because every earlier measurement was two-player, where
  // a big creature really is most of the game. At four, a 6/4 attacking into
  // three opponents' blockers is a far worse deal than 1.5 claims.
  power: 0.5,
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
  // Stays at 0. Raising it is tempting and backwards: it counts *your own*
  // untapped sources, so casting a two-drop taps two lands (-2) and gains at
  // most one source, making every spell look like a loss. Measured: Talisman
  // of Impulse went from -0.50 to -1.50 against passing at `untappedMana: 1`.
  // This is the "reads as a cost the moment the resource is spent" trap the
  // comment on `handManaValue` above describes.
  untappedMana: 0,
  // **Must not sit below `hand`.** A noncreature permanent was worth
  // `otherPermanents` + `permanentManaValue` (0.5/mv) on the battlefield
  // against `hand` (2.0) in hand, so *casting* one cost the bot points:
  // Sol Ring scored -1.00 against passing, a Talisman -0.50, a three-mana
  // rock exactly 0.00 — and ties go to passing. The artifact-heavy Rakdos
  // precon declined 82% of the early plays it could have made, which is the
  // "bot does nothing but land-pass" people actually see.
  //
  // The invariant is the same one `extraLands` has against `hand`, and for
  // the same reason: a card you have *deployed* cannot be worth less than the
  // card sitting in your hand, or the evaluation will refuse to deploy it.
  // Kept just under `creatures` (2.5) — a Sol Ring is not a body.
  otherPermanents: 2,
  permanentManaValue: 0.5,
  loyalty: 1,
  counters: 0.5,
  library: 0.05,
  // Zero for the same reason as `lifeDanger`: a strict no-op until swept.
  libraryDanger: 0,
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

/**
 * Force the one inequality the feature set can't express on its own: **a land
 * in hand is never worth more than a land on the battlefield.**
 *
 * Playing a land moves a card from hand to the battlefield, so it scores
 * `lands - hand` (or `extraLands - hand` past the cap). Below zero the bot
 * stops developing, which is the catatonic failure this whole evaluation was
 * designed around; *at* zero it is just as bad, because the priority search
 * scores passing first and skips ties, so an exactly-even land drop is
 * declined. Three of the four checked-in champions had `extraLands` exactly
 * equal to `hand`, and only survived because a basic land happens to add
 * `untappedMana` too — luck, not design.
 *
 * The root cause is that `hand` prices every card the same, so a land in hand
 * is credited like a bomb. Splitting lands out of `hand` would be the deeper
 * fix; until then this guarantees the sign, for hand-written vectors, fitted
 * ones and tuner mutations alike, rather than leaving each to get it right.
 *
 * `LAND_DROP_MARGIN` keeps it a strict gain rather than a tie.
 */
export const LAND_DROP_MARGIN = 1.25;

export function normalizeWeights(weights: EvalWeights): EvalWeights {
  const floor = weights.hand * LAND_DROP_MARGIN;
  if (weights.lands >= floor && weights.extraLands >= floor) return weights;
  return {
    ...weights,
    lands: Math.max(weights.lands, floor),
    extraLands: Math.max(weights.extraLands, floor),
  };
}

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

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
  /** Mana a turn from nonland permanents, net of what tapping them costs:
   * Sol Ring 2, a Signet 1, a dork 1. Lands have their own terms; before
   * this, a rock was only a permanent, and the audit priced Sol Ring below a
   * Forest. */
  readonly nonlandMana: number;
  /** Cards a round of the table that permanents keep drawing their
   * controller — an upkeep draw (Phyrexian Arena, 1), a draw off each
   * opponent's spell (Rhystic Study, half a card per opponent, since they can
   * pay), a repeatable draw ability. See `drawRate` in `features.ts`. */
  readonly drawEngines: number;
  /** Our commanders on the battlefield under our control: the one card a
   * deck is built around, which `creatures` scores like any other. */
  readonly commanderOnBoard: number;
  /** Subtracted: the combat damage of creatures that can't attack (Pacifism,
   * defender). At `power`'s weight it takes back exactly what `power` gives
   * them. */
  readonly idlePower: number;
  /** Identical noncreature tokens past `TOKEN_CAP` (features.ts) — the
   * fifth Treasure of a pile on. At `otherPermanents`' weight it scores exactly
   * as before the cap. */
  readonly extraTokens: number;
  /** Subtracted: the combat damage opponents' creatures could turn on us,
   * in full from a player who attacked us within the last round
   * (`features.ts`). */
  readonly threat: number;
  /** Counterspells in our hand (`features.ts`): what one could still answer,
   * on top of the card `hand` counts it as. */
  readonly answers: number;
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
  // A point of life costs 0.5 above `LIFE_DANGER_AT` (15) and 1.5 below it —
  // for opponents as for yourself, so damage that brings one into range is
  // worth three times what it was worth at 40. At a flat 1, every point was
  // half a card whatever the total: a card up for two life (Read the Bones,
  // Sign in Blood) scored exactly zero, and since ties go to passing, v2 never
  // cast either. Now it does down to 17 life ("pays life for cards while it
  // can spare it", "keeps its life when it is running out"). Benched against
  // the flat vector at four players over 400 games: 24.8% [20.8, 29.2] —
  // level, which is as much as 400 games can say
  // (`docs/plans/bot-effect-knowledge.md`, step 5).
  life: 0.5,
  lifeDanger: 1,
  commanderDamage: 2,
  hand: 2,
  // A tie-breaker, no more. At zero a Forest in hand was worth a Craw Wurm in
  // hand, so a forced discard with ten lands out threw away whichever came
  // first ("discards its extra land, not its bomb"). Any more and it starts to
  // cost casting, since a card's mana value in hand is what casting it gives
  // up — Sol Ring on turn one wins by only half a point — and at 0.3 (beside
  // `untappedMana` 0.1) it cost 8 points of win rate at four players (36% ->
  // 28%, the plan's Phase 1 notes). Hand-tuned to a scenario, step 8 of
  // `docs/plans/bot-effect-knowledge.md`, with `commanderOnBoard` and
  // `otherOpponents` below: the three together benched 26.8% [22.7, 31.4]
  // against three of the vector without them, four players, 399 games —
  // level.
  handManaValue: 0.05,
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
  // Zero, and measured so: at 1 and 2 (with `commanderOnBoard` 2 and
  // `idlePower` 0.5) they benched 26.0% [21.9, 30.5] against three of the
  // vector without them, four players, 400 games — nothing a weight should
  // ship on (`docs/plans/bot-effect-knowledge.md`, step 5). The terms stay for
  // a sweep that finds their peak, if one exists.
  nonlandMana: 0,
  // A card a round at 4 — about two cards, a couple of turns of Phyrexian
  // Arena — so an opponent's Rhystic Study is worth a Counterspell's reserve
  // (`answers`): at 0, countering one scored 1.4, below a Divination. Priced
  // by rate since 2026-09-28, so Rhystic Study at four players (1.5 a round)
  // is worth half again an Arena.
  drawEngines: 4,
  // A commander is the deck it leads, not a creature like any other. At zero
  // the bot killed a bigger vanilla creature rather than a commander one hit
  // from lethal commander damage ("kills the commander one hit from lethal
  // commander damage") — nothing else in the evaluation looks at the next
  // attack. Hand-tuned to that scenario (step 8); it values the bot's own on
  // the battlefield the same way.
  commanderOnBoard: 3,
  // **Keep equal to `power`.** Not a free weight: `power` is the combat damage
  // a creature could deal, and one that can't attack deals none, so this
  // takes back exactly what `power` credits it. At zero, v2 enchanted its own
  // tapped Craw Wurm with Pacifism whenever the Wurm was the only legal
  // target — the Aura is a permanent for a card, and nothing the evaluation
  // counted was lost (the "does not pacify its own creature" scenario). The
  // same term is what makes pacifying an opponent's attacker worth its power.
  idlePower: 0.5,
  // Zero, and it has to be: any value above it makes "pump, make eighteen
  // Treasures" a gain forever, which is how seed 50's bot farmed Treasures
  // off a dead player until the game timed out. A pile past a turn's spending
  // is mana the evaluation can't see a use for — `untappedMana` is 0 too.
  extraTokens: 0,
  // The lever `bot:fit-scenarios` found for "kills the creature attacking
  // it, not the leader's", breaking no other scenario: a creature whose
  // controller swung at us last round counts its combat damage in full, as a
  // share of what we have left to lose (`features.ts`). The scenario flips at
  // about 0.66; 1.0 keeps a margin of ~2 without the removal-happy streak 1.5
  // showed in `bot:diff` (a Fireball on a Cat token over Phyrexian Arena).
  threat: 1,
  // The reserve a Counterspell in hand holds back for: the bot counters a
  // spell only when that's worth more than this. At 3 it lets a Signet (0.9),
  // a Divination (1.85) and a Cultivate (2.35) through, and counters a
  // Grizzly Bears (4.6), a four-player Rhystic Study (7.4), a Craw
  // Wurm (10.9) and a wrath of its own board (26.8) — "saves Counterspell for
  // a threat", which no weight on the old terms could fix without also
  // stopping the bot casting its rocks and draw spells.
  answers: 3,
  opponent: 1,
  // Counted against the *average* of the trailing opponents, so at four
  // players each one's board weighs a quarter of the leader's here. At 0.25
  // (an eighth) the bot held its removal while a trailing player's creature
  // was the only one on the table ("kills a trailing player's threat when the
  // leader has none"); "removal takes the leader's threat first" keeps the
  // leader first. Hand-tuned (step 8); what's still missing is a term for the
  // threat to *us* — BACKLOG, "Removal only for the leader".
  otherOpponents: 0.5,
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

/**
 * One state, read once and scorable under any weight vector: the game's result
 * if it's over, otherwise every live player's features. `evaluateState` is
 * `scoreOutcome` of this, so a caller that scores the same state many times
 * over — `bot:fit-scenarios`, trying weight vectors against the states a
 * search reached — runs exactly the arithmetic the bot does.
 */
export interface EvalOutcome {
  /** The score whatever the weights: a win, a loss or a draw. */
  readonly decided?: number;
  /** `null` once `me` has lost in a game that goes on without them. */
  readonly mine: PlayerFeatures | null;
  /** Every opponent still in the game. */
  readonly theirs: readonly PlayerFeatures[];
}

export function outcomeOf(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  landCap: number,
): EvalOutcome {
  if (state.result.over) {
    const decided = state.result.winner === null ? DRAW : state.result.winner === me ? WIN : -WIN;
    return { decided, mine: null, theirs: [] };
  }
  const own = state.players[me];
  const mine =
    own === undefined || own.hasLost ? null : playerFeatures(state, registry, me, true, landCap);
  const theirs = state.turnOrder
    .filter((player) => player !== me && !state.players[player].hasLost)
    .map((player) => playerFeatures(state, registry, player, false, landCap));
  return { mine, theirs };
}

/**
 * Score an {@link EvalOutcome} from `me`'s seat: my position, minus my
 * strongest opponent's, minus a smaller share of the average of everyone else
 * still in the game.
 *
 * Only the strongest opponent used to count, which made a four-player bot
 * indifferent to everyone but the leader — happy to feed the second-best
 * player a whole board as long as the leader stayed put.
 */
export function scoreOutcome(outcome: EvalOutcome, weights: EvalWeights): number {
  if (outcome.decided !== undefined) return outcome.decided;
  const mine = outcome.mine === null ? DEAD : scoreFeatures(outcome.mine, weights);
  const theirs = outcome.theirs.map((f) => scoreFeatures(f, weights)).sort((a, b) => b - a);
  if (theirs.length === 0) return mine;

  const [strongest, ...rest] = theirs;
  const others = rest.length > 0 ? rest.reduce((a, b) => a + b, 0) / rest.length : 0;
  return mine - weights.opponent * strongest - weights.otherOpponents * others;
}

/** Score `state` from `me`'s seat — see {@link scoreOutcome}. */
export function evaluateState(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  weights: EvalWeights = DEFAULT_WEIGHTS,
): number {
  return scoreOutcome(outcomeOf(state, registry, me, weights.landCap), weights);
}

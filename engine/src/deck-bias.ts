/**
 * Deck biases: what a deck wants that a bot with no plan for it would get
 * backwards.
 *
 * The bots' card knowledge is generic. `target-polarity.ts` says milling a
 * player harms them, so a mill trigger goes at an opponent; the evaluation
 * prices a graveyard card at a twentieth of a card in hand, for everyone
 * alike. That's right for most decks and wrong for a few: Teval, the Balanced
 * Scale's deck mills itself to return lands and make Zombies, and wants every
 * mill it controls pointed at its own library. A bias is that deck's
 * correction, read wherever the generic rule is read — never a script of
 * plays, only a different idea of which side an effect belongs on and what
 * its own board is worth.
 *
 * ## Keyed by commander
 *
 * A bot doesn't know its deck's name — the game only knows its cards — but
 * a commander is public, fixed for the game, and the one card that says what
 * a Commander deck is for. So the table is keyed by commander name and read
 * off the `GameState` (`deckBias`), which means everything that asks the
 * question gets the same answer without being told: v1, v2, the v1 that
 * plays every seat in v2's rollouts (an opponent's Teval mills itself there
 * too), and a deck a person built around Teval as much as the precon.
 *
 * ## What a bias may say
 *
 * - **`polarity`**: effect kinds whose target slots this deck reads the
 *   other way round (`mill: "help"`), handed to every `target-polarity.ts`
 *   question. It moves v1's targeting, v2's target ranking, the slots v2
 *   simulates first, and `effect-worth.ts`' reading of a "you may".
 * - **`ownWeights`**: evaluation weights for the bot's *own* features only
 *   (`bot/evaluate.ts`, `outcomeOf`). The evaluation is symmetric — an
 *   opponent's graveyard is priced as ours is — and a bias mustn't make the
 *   bot think an opponent's graveyard matters to *them* the way Teval's does
 *   to Teval. Opponents are still scored on the shared weights.
 *
 * Each entry says why. Add one when a deck's bot is seen playing against its
 * own plan; pin it with a gate scenario that fails without the entry
 * (`bot/scenarios.ts`). Design record: `docs/plans/deck-biases.md`.
 */

import type { EvalWeights } from "./bot/evaluate.js";
import type { PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";
import type { PolarityBias } from "./target-polarity.js";

export interface DeckBias {
  /** What the deck wants, in a line — for the record, and for a reader
   * wondering why the bot did it. */
  readonly why: string;
  /** Effect kinds whose slots this deck aims the other way. */
  readonly polarity?: PolarityBias;
  /** Weights for this player's own features. Keys left out keep the
   * shared weight; opponents are always scored on the shared ones. */
  readonly ownWeights?: Readonly<Partial<EvalWeights>>;
}

/**
 * The biases, by commander name. A deck with two commanders (Partner, a
 * Background) takes both entries, the second's keys over the first's.
 */
export const COMMANDER_BIASES: Readonly<Record<string, DeckBias>> = {
  // Sultai Arisen (`SAMPLE_DECKS`): "mill yourself, bring lands and
  // creatures back, and make Zombies as cards leave the graveyard". Hedron
  // Crab and Mindscour Dragon say "target player mills"; generic polarity
  // aims both at an opponent. The deck's graveyard is its second hand —
  // Teval returns its lands, recursion and reanimation take its creatures
  // back, and every card that leaves makes a Zombie — so its own graveyard
  // cards are worth five times the shared
  // 0.05: milling itself three is +0.6 rather than nothing. `libraryDanger`
  // (0 for everyone else) keeps v2 from milling itself out: below 15 cards
  // each card off the top costs a point, so it stops at about 18.
  "Teval, the Balanced Scale": {
    why: "Self-mill: its own graveyard is a resource, so it mills itself, never an opponent.",
    polarity: { mill: "help" },
    ownWeights: { graveyard: 0.25, libraryDanger: 1 },
  },
};

/** One merged bias per set of commanders, so a merge is done once and the
 * polarity memos (keyed by the bias object) are shared. */
const merged = new Map<string, DeckBias | null>();

/**
 * The bias of `player`'s deck: their commanders' entries, merged, or `null`
 * when none has one (or they have no commander). Read from the commanders
 * they *own*, wherever those are — a stolen commander doesn't change whose
 * deck it leads.
 */
export function deckBias(state: GameState, player: PlayerId): DeckBias | null {
  // Asked at every targeting question and every evaluation, so the scan is
  // done once per objects table — once per game, and once per clone a
  // search makes. Commanders are fixed from the game's setup on, so a table
  // mutated in place never changes the answer.
  let byPlayer = byObjects.get(state.objects);
  if (byPlayer === undefined) {
    byPlayer = new Map();
    byObjects.set(state.objects, byPlayer);
  }
  let found = byPlayer.get(player);
  if (found === undefined) {
    found = scanBias(state, player);
    byPlayer.set(player, found);
  }
  return found;
}

const byObjects = new WeakMap<object, Map<PlayerId, DeckBias | null>>();

function scanBias(state: GameState, player: PlayerId): DeckBias | null {
  const names: string[] = [];
  for (const object of Object.values(state.objects)) {
    if (object.isCommander && object.owner === player) names.push(object.cardName);
  }
  if (names.length === 0) return null;
  names.sort();
  const key = names.join("\n");
  let found = merged.get(key);
  if (found === undefined) {
    const entries = names.map((name) => COMMANDER_BIASES[name]).filter((b) => b !== undefined);
    found =
      entries.length === 0
        ? null
        : entries.length === 1
          ? entries[0]
          : {
              why: entries.map((b) => b.why).join(" "),
              polarity: Object.assign({}, ...entries.map((b) => b.polarity ?? {})),
              ownWeights: Object.assign({}, ...entries.map((b) => b.ownWeights ?? {})),
            };
    merged.set(key, found);
  }
  return found;
}

/** Just the polarity half of {@link deckBias}, for the targeting questions. */
export function polarityBias(state: GameState, player: PlayerId): PolarityBias | undefined {
  return deckBias(state, player)?.polarity;
}

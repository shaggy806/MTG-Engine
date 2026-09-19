/**
 * Sampling a plausible world from one seat's point of view — the end of the
 * bot reading its opponents' hands.
 *
 * `ControllerView.state` is the real, un-redacted `GameState`, opponents' hands
 * and library order included, and v2 exploited that hard: it scored a spell
 * against the exact card an opponent was holding, and its simulated draws came
 * off the real library because `fromSnapshot` restores `rngState`. See "Known:
 * the bot cheats" in `docs/plans/smarter-bots.md`.
 *
 * ## Why this is the centre of v3 rather than a tidiness exercise
 *
 * Three separate things it buys, only one of which is about honesty:
 *
 * 1. **Measured strength becomes strength against people.** A bot that never
 *    has to guess looks better in self-play than it plays against a human, and
 *    nothing in v2's numbers distinguishes the two.
 * 2. **It is the variance control deeper rollouts need anyway.** A single
 *    playout of a three-turn future is one sample of a very noisy variable;
 *    averaging over sampled worlds is what turns it into an estimate.
 * 3. **It makes hidden-information play expressible at all.** Holding up a
 *    counterspell, playing round a likely wrath — none of it means anything
 *    when you can simply look.
 *
 * ## What "plausible" means here, and what it deliberately ignores
 *
 * The honest reconstruction: an opponent's hand and library are one pool of
 * cards we can't see into, so they're pooled, shuffled, and dealt back at the
 * hand size we *can* see. Our own library gets shuffled too — we know its
 * contents but not its order, and leaving it alone would keep the sharper half
 * of the cheat.
 *
 * Two simplifications, both deliberate and both costing us information we
 * legitimately have:
 *
 * - **Cards an opponent has revealed** (a foretold card's owner, something
 *   shown to the table) are re-pooled like anything else, so the bot forgets
 *   them. Tracking revealed cards is real work for a rare payoff.
 * - **A card's identity is not inferred from play patterns.** No "they left two
 *   mana up, it's probably a counterspell".
 *
 * Both make the bot weaker than a perfectly-informed reasoner, which is the
 * correct direction to be wrong in.
 */

import { createRng, shuffle } from "../primitives.js";
import type { PlayerId, Rng } from "../primitives.js";
import type { GameState } from "../state.js";
import { cloneGameState } from "../state.js";

/**
 * A copy of `state` with the zones `me` cannot see resampled: every opponent's
 * hand redealt from their own hand-plus-library pool, and every library
 * reshuffled.
 *
 * Only object *ids* move between zones — the objects themselves, and every
 * reference to them from anywhere else in the state, are untouched. That is
 * what keeps a resampled world internally consistent.
 *
 * **Only safe at a clean decision point.** A state with something mid-flight —
 * a targeted trigger waiting on a choice, a spell resolving that names a
 * specific card in a hand — can hold a reference to an object whose zone this
 * would change underneath it. Callers determinize at a priority window with an
 * empty stack, and {@link canDeterminize} is the check.
 */
export function determinize(state: GameState, me: PlayerId, rng: Rng): GameState {
  const next = cloneGameState({ ...state, eventLog: [] });
  for (const player of next.turnOrder) {
    const zones = next.zones.perPlayer[player];
    if (player === me) {
      // Our own contents are known; only the order is hidden. Leaving this out
      // would keep the sharper half of the cheat — knowing our own next draws.
      zones.library = shuffle(zones.library, rng);
      continue;
    }
    const pool = shuffle([...zones.hand, ...zones.library], rng);
    zones.hand = pool.slice(0, zones.hand.length);
    zones.library = pool.slice(zones.hand.length);
  }
  return next;
}

/** Whether `state` is at a point where resampling can't break a reference — an
 * empty stack, nothing awaited, no queued decision mid-resolution. */
export function canDeterminize(state: GameState): boolean {
  return (
    state.awaiting === null &&
    state.zones.shared.stack.length === 0 &&
    state.pendingTargetedTrigger === null &&
    state.pendingTargetedCast === null
  );
}

/**
 * `count` sampled worlds from `me`'s point of view, drawn from one seeded
 * stream.
 *
 * **Every candidate action at one decision must be scored against the same
 * list.** This is common random numbers, and it is not a refinement — v2
 * learned the hard way what happens without it. Comparing two sibling moves on
 * *different* shuffles measures which one drew better, not which one was
 * better, and on that data the shipped evaluator appeared to rank pairs
 * correctly 13% of the time. The artefact vanished entirely once the draws were
 * shared.
 *
 * Seeding from the state (rather than from wall-clock or a module-level
 * generator) is what keeps a replay exact: the same position always samples the
 * same worlds.
 */
export function sampleWorlds(
  state: GameState,
  me: PlayerId,
  count: number,
  seed: number = state.rngState,
): GameState[] {
  if (!canDeterminize(state)) return [];
  const rng: Rng = createRng(seed);
  return Array.from({ length: count }, () => determinize(state, me, rng));
}

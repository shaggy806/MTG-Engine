/**
 * Low-level primitives shared across the engine: branded identifiers and a
 * deterministic PRNG so that a game replays identically from its seed.
 */

/** Opaque identifier for a player. Create with {@link asPlayerId}. */
export type PlayerId = string & { readonly __brand: "PlayerId" };

/** Opaque identifier for a game object (a card, token, or copy on the stack). */
export type ObjectId = string & { readonly __brand: "ObjectId" };

export const asPlayerId = (raw: string): PlayerId => raw as PlayerId;
export const asObjectId = (raw: string): ObjectId => raw as ObjectId;

/**
 * A seeded pseudo-random number generator. The current {@link Rng.seed} fully
 * describes its position in the stream, so persisting it and rebuilding with
 * {@link createRng} resumes the exact same sequence.
 */
export interface Rng {
  /** Current internal state; feed back into {@link createRng} to resume. */
  readonly seed: number;
  /** Next float in `[0, 1)`. */
  next(): number;
  /** Next integer in `[0, maxExclusive)`. */
  int(maxExclusive: number): number;
}

/** Deterministic 32-bit PRNG (mulberry32). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    get seed() {
      return state >>> 0;
    },
    next,
    int(maxExclusive: number): number {
      if (maxExclusive <= 0) return 0;
      return Math.floor(next() * maxExclusive);
    },
  };
}

/** Fisher–Yates shuffle. Returns a new array; does not mutate `items`. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

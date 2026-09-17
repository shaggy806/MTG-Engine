// Deck seating for bot-vs-bot runs, shared by `tune-bot-worker.mjs` and
// `harvest-worker.mjs`.
//
// Seeds come in blocks of `players` games. Every game in a block uses the same
// seating of decks, and the measured seat moves round the table within it, so
// over a block every deck in the pairing is played from every position:
// neither the decks' relative strength nor the play/draw advantage is baked
// into the result. Each block takes the next seating from a fixed shuffle of
// every ordering of `players` distinct decks drawn from `SAMPLE_DECKS`.

import { SAMPLE_DECKS, asPlayerId } from "../dist/index.js";

export const SEATS = ["alice", "bob", "carol", "dave"].map(asPlayerId);

/** Every ordering of `k` distinct indices below `n`. */
function permutations(n, k) {
  if (k === 0) return [[]];
  const out = [];
  for (const rest of permutations(n, k - 1)) {
    for (let i = 0; i < n; i += 1) if (!rest.includes(i)) out.push([...rest, i]);
  }
  return out;
}

/** Deterministic Fisher-Yates, so every worker agrees on the seating order. */
function shuffled(list, seed) {
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const seatingsByPlayers = new Map();

function seatingFor(players, block) {
  let seatings = seatingsByPlayers.get(players);
  if (seatings === undefined) {
    seatings = shuffled(permutations(SAMPLE_DECKS.length, players), 0x5ea7 + players);
    seatingsByPlayers.set(players, seatings);
  }
  return seatings[block % seatings.length];
}

/**
 * Everything one seed decides: which seats are at the table, which deck each
 * one brought, which seat is the one being measured, and which block this game
 * belongs to.
 */
export function tableFor(seed, players) {
  const seats = SEATS.slice(0, players);
  const game0 = seed - 1;
  const block = Math.floor(game0 / players);
  const seating = seatingFor(players, block);
  return {
    seats,
    block,
    measuredSeat: seats[game0 % players],
    decks: seats.map((_, i) => SAMPLE_DECKS[seating[i]]),
  };
}

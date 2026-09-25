// The fuzzer's decks (`random-demo.mjs`): one 100-card Commander deck per
// seat, built from the seed out of the whole card pool.
//
// These replaced four hand-kept lists (243 to 500 cards) that every new card
// was added to by hand. Those grew with the pool until a game drew a given
// card one time in six and nobody could run out of cards, so a four-player
// game could last 300 turns. A deck built per seed covers the pool across a
// run's seeds instead, picks up a new card with no edit here, and plays out
// like a real game.
//
// A deck: a random commander (one that can command alone), then spells and
// nonbasic lands drawn from every deckable card inside its colour identity,
// then basics split across its colours (Wastes for a colourless one). Same
// seed, same decks.

import {
  POOL_CARDS,
  canCommandAlone,
  colorIdentityOf,
  createDefaultRegistry,
  createRng,
  isDeckableCard,
  withinIdentity,
} from "../dist/index.js";

const SPELLS = 61;
const NONBASIC_LANDS = 10;
/** 1 commander + 61 spells + 10 nonbasic lands + 28 basics = 100. */
const BASICS = 28;
const BASIC_OF = { W: "Plains", U: "Island", B: "Swamp", R: "Mountain", G: "Forest" };

/**
 * Cards that mean little without another one beside them. When a deck holds
 * any card in `when` (its commander included), the cards in `add` join it,
 * if they fit the identity. Only the pairings the random draw would almost
 * never make.
 */
const PACKAGES = [
  // Counters that persist across zone changes, back off a reanimation.
  { when: ["Skullbriar, the Walking Grave"], add: ["Reanimate"] },
  // Statics that let a defender attack, with a defender to use them.
  {
    when: ["Arcades, the Strategist", "Felothar the Steadfast", "High Alert", "Ancient Lumberknot"],
    add: ["Wall of Wood"],
  },
];

const registry = createDefaultRegistry();
const deckable = POOL_CARDS.filter(isDeckableCard);
const identityOf = new Map(deckable.map((d) => [d.name, colorIdentityOf(d, registry)]));
const byName = new Map(deckable.map((d) => [d.name, d]));
const isLand = (d) => d.types.includes("land");
const isBasic = (d) => d.supertypes.includes("basic");

const commanders = deckable.filter(canCommandAlone);
const spells = deckable.filter((d) => !isLand(d));
const nonbasicLands = deckable.filter((d) => isLand(d) && !isBasic(d));

/** Fisher–Yates off the seeded generator. */
function shuffled(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Every name in `names` that isn't a deckable pool card. */
export function unknownCards(names) {
  return names.filter((n) => !byName.has(n));
}

/**
 * The pool, walked in a fixed order: pass `n` over `list` is its own seeded
 * shuffle, and position `i` is card `i mod length` of pass `i div length`.
 * Seat after seat, seed after seed, reads the next window of it — so a run
 * of seeds sweeps the whole pool rather than drawing the same favourites
 * again, while each seed's decks still depend on nothing but the seed.
 */
function walker(list, salt) {
  const passes = new Map();
  const pass = (n) => {
    if (!passes.has(n)) passes.set(n, shuffled(list, createRng(n * 7907 + salt)));
    return passes.get(n);
  };
  return (i) => pass(Math.floor(i / list.length))[i % list.length];
}
const spellAt = walker(spells, 1);
const landAt = walker(nonbasicLands, 2);
/** How many commanders are weighed against a window. */
const COMMANDER_SAMPLE = 12;

/**
 * One seat's deck: seat number `index` of the whole run (seed-major), so its
 * windows over the pool follow the seat before it. `forced` are cards every
 * deck must hold (`--with`): the commander is chosen among those whose
 * identity allows all of them.
 */
function deckFor(player, index, rng, forced) {
  const spellWindow = Array.from({ length: SPELLS }, (_, k) => spellAt(index * SPELLS + k));
  const landWindow = Array.from({ length: NONBASIC_LANDS }, (_, k) => landAt(index * NONBASIC_LANDS + k));

  // The commander: of a random handful the forced cards allow, whichever
  // fits the most of this seat's window — so few of its cards are skipped.
  const need = new Set(forced.flatMap((n) => [...identityOf.get(n)]));
  const allowed = commanders.filter((c) => withinIdentity(need, identityOf.get(c.name)));
  if (allowed.length === 0) throw new Error(`no commander's identity allows ${forced.join(", ")}`);
  const fitsUnder = (commander) => (d) =>
    d.name !== commander.name && withinIdentity(identityOf.get(d.name), identityOf.get(commander.name));
  let commander = null;
  let best = -1;
  for (const c of shuffled(allowed, rng).slice(0, COMMANDER_SAMPLE)) {
    const score = spellWindow.filter(fitsUnder(c)).length + landWindow.filter(fitsUnder(c)).length;
    if (score > best) [commander, best] = [c, score];
  }
  const identity = identityOf.get(commander.name);
  const fits = fitsUnder(commander);

  // The window's cards that fit, then random ones to make up the count.
  const chosen = new Set(forced.filter((n) => n !== commander.name));
  const take = (window, from, count) => {
    for (const d of [...window, ...shuffled(from, rng)]) {
      if (chosen.size >= count) break;
      if (fits(d)) chosen.add(d.name);
    }
  };
  const forcedLands = [...chosen].filter((n) => isLand(byName.get(n))).length;
  take(spellWindow, spells, SPELLS + forcedLands);
  take(landWindow, nonbasicLands, SPELLS + NONBASIC_LANDS);
  for (const { when, add } of PACKAGES) {
    if (!when.some((n) => chosen.has(n) || n === commander.name)) continue;
    for (const n of add) if (byName.has(n) && fits(byName.get(n))) chosen.add(n);
  }

  const colors = ["W", "U", "B", "R", "G"].filter((c) => identity.has(c));
  const basics = Array.from({ length: BASICS }, (_, i) =>
    colors.length === 0 ? "Wastes" : BASIC_OF[colors[i % colors.length]],
  );
  return { player, commander: commander.name, cards: [...chosen, ...basics] };
}

/** Every seat's deck for `seed`, in seating order. */
export function seatsFor(seed, players, { forced = [] } = {}) {
  const rng = createRng(seed * 104729 + 17);
  return players.map((player, s) => deckFor(player, (seed - 1) * players.length + s, rng, forced));
}

/** How much of the pool the decks for `seeds` hold: every deckable card that
 * appears in at least one deck (as a commander or in the 99). */
export function coverage(seeds, players) {
  const seen = new Set();
  for (const seed of seeds) {
    for (const seat of seatsFor(seed, players)) {
      seen.add(seat.commander);
      for (const n of seat.cards) seen.add(n);
    }
  }
  const missing = deckable.map((d) => d.name).filter((n) => !seen.has(n));
  return { total: deckable.length, seen: deckable.length - missing.length, missing };
}

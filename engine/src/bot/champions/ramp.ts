import type { Champion } from "./index.js";

/**
 * A deliberately *ramp-heavy* style: mana sources and expensive permanents are
 * the thing, and it will happily spend a turn on a rock over a creature.
 *
 * Its job in the gauntlet is the long game. A candidate tuned only against
 * opponents that curve out and swing never has to answer "what if they're
 * still alive on turn fifteen with twelve mana" — this one is, and the
 * `landCap` it plays past is exactly the term the baseline is least sure
 * about. Derived from `baseline-2026-09-17` by hand: lands, land cap, untapped
 * mana and permanent mana value all up; power down.
 */
export const RAMP: Champion = {
  id: "ramp",
  date: "2026-09-17",
  note: "hand-set style: mana and big permanents over a curve — high land cap, values untapped mana",
  weights: {
    life: 1.25,
    commanderDamage: 2,
    hand: 2,
    handManaValue: 0.3,
    creatures: 2,
    power: 0.75,
    toughness: 0.5,
    evasivePower: 0.4,
    combatKeywords: 0.4,
    untappedCreatures: 0.5,
    lands: 6,
    landCap: 12,
    extraLands: 2,
    untappedMana: 0.75,
    otherPermanents: 1,
    permanentManaValue: 1.25,
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
    crackbackParanoia: 0.75,
    crackbackMargin: 4,
  },
};

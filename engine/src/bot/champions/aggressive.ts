import type { Champion } from "./index.js";

/**
 * A deliberately *aggressive* style, not a tuned result: it values board
 * presence and the damage it can push far above its own survival, and it barely
 * flinches at the crackback.
 *
 * Its job in the gauntlet is to punish a candidate that has learned to win by
 * sitting still — a vector tuned against cautious opponents can look excellent
 * while never developing a clock, and this one ends the game before that
 * matters. Derived from `baseline-2026-09-17` by hand: power and evasion up,
 * life and blockers-kept-home down, `crackbackParanoia` near zero and no
 * margin, so it races almost anything.
 */
export const AGGRESSIVE: Champion = {
  id: "aggressive",
  date: "2026-09-17",
  note: "hand-set style: race, don't durdle — power/evasion up, life and crackback caution down",
  weights: {
    life: 0.4,
    commanderDamage: 1,
    hand: 1.5,
    handManaValue: 0,
    creatures: 3,
    power: 3,
    toughness: 0.2,
    evasivePower: 1.5,
    combatKeywords: 0.75,
    untappedCreatures: 0.1,
    lands: 4,
    landCap: 6,
    extraLands: 1.5,
    untappedMana: 0,
    otherPermanents: 0.3,
    permanentManaValue: 0.3,
    loyalty: 0.75,
    counters: 0.5,
    library: 0.02,
    graveyard: 0.05,
    graveyardCastable: 0.75,
    energy: 0.3,
    monarch: 3,
    emblems: 3,
    commanderTax: 0.25,
    opponent: 1,
    otherOpponents: 0.25,
    crackbackParanoia: 0.1,
    crackbackMargin: 0,
  },
};

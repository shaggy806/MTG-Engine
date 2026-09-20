import type { Champion } from "./index.js";

/**
 * The hand-picked vector the bot shipped Phases 1-4 with — the incumbent every
 * tuning run starts from, and the gauntlet's anchor.
 *
 * Benched at freeze time (`bot:bench`, 18 workers, live-room Commander rules):
 * 69.5% [64.8, 73.8] over 400 two-player games and 52.0% [45.1, 58.8] over 200
 * four-player games against v1 (even is 50% and 25%).
 */
export const BASELINE_2026_09_17: Champion = {
  id: "baseline-2026-09-17",
  date: "2026-09-17",
  note: "hand-picked Phase 1-4 defaults; 69.5% at 2p / 52.0% at 4p vs v1",
  weights: {
    life: 1,
    // Frozen with the gauntlet: 0 keeps this champion exactly what it was
    // before `lifeDanger`/`libraryDanger` existed.
    lifeDanger: 0,
    commanderDamage: 2,
    hand: 2,
    handManaValue: 0,
    creatures: 2.5,
    power: 1.5,
    toughness: 0.5,
    evasivePower: 0.5,
    combatKeywords: 0.5,
    untappedCreatures: 0.5,
    lands: 4.5,
    landCap: 7,
    extraLands: 2.5,
    untappedMana: 0,
    otherPermanents: 0.5,
    permanentManaValue: 0.5,
    loyalty: 1,
    counters: 0.5,
    library: 0.05,
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
  },
};

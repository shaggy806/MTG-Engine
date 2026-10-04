import type { Champion } from "./index.js";

/**
 * The v2 vector live rooms seat, as `DEFAULT_WEIGHTS` stood at the end of
 * 2026-09-27, after `shipped-2026-09-27b`:
 *
 * - `answers` 3 — a Counterspell in hand is held back for anything worth
 *   more than this to counter: a Signet or a Divination goes through, a
 *   creature, a draw engine or a wrath of our board doesn't.
 * - `drawEngines` 4 — an opponent's Rhystic Study is worth countering.
 *
 * Read with `bot:diff` rather than benched.
 */
export const SHIPPED_2026_09_27C: Champion = {
  id: "shipped-2026-09-27c",
  date: "2026-09-27",
  note: "DEFAULT_WEIGHTS at the end of 2026-09-27: shipped-2026-09-27b with a Counterspell reserve (answers 3) and draw engines at 4",
  weights: {
    life: 0.5,
    lifeDanger: 1,
    commanderDamage: 2,
    hand: 2,
    handManaValue: 0.05,
    creatures: 2.5,
    power: 0.5,
    toughness: 0.5,
    evasivePower: 0.5,
    combatKeywords: 0.5,
    untappedCreatures: 0.5,
    lands: 4.5,
    landCap: 7,
    extraLands: 2.5,
    untappedMana: 0,
    otherPermanents: 2,
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
    nonlandMana: 0,
    drawEngines: 4,
    commanderOnBoard: 3,
    idlePower: 0.5,
    extraTokens: 0,
    threat: 1,
    answers: 3,
    // Scored as `otherPermanents` was before one-shot tokens got their own term.
    resourceTokens: 2,
    tokenEngines: 0,
    earlyRemoval: 0,
    earlyMana: 0,
    opponent: 1,
    otherOpponents: 0.5,
    crackbackParanoia: 0.5,
    crackbackMargin: 2,
  },
};

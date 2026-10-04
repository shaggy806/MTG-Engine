import type { Champion } from "./index.js";

/**
 * A deliberately *defensive* style: life, toughness and blockers kept home are
 * what it wants, and it declines any attack whose crackback comes near lethal.
 *
 * Its job in the gauntlet is the mirror of `aggressive` — it punishes a
 * candidate that has learned to swing into anything because every opponent it
 * ever met swung back into its blockers. Against this one an unchecked alpha
 * strike just donates creatures. Derived from `baseline-2026-09-17` by hand.
 */
export const DEFENSIVE: Champion = {
  id: "defensive",
  date: "2026-09-17",
  note: "hand-set style: survive first — life/toughness/blockers up, paranoid about the crackback",
  weights: {
    life: 2,
    // Frozen with the gauntlet: 0 keeps this champion exactly what it was
    // before `lifeDanger`/`libraryDanger` existed.
    lifeDanger: 0,
    commanderDamage: 3,
    hand: 2.5,
    handManaValue: 0,
    creatures: 2.5,
    power: 0.75,
    toughness: 1.5,
    evasivePower: 0.25,
    combatKeywords: 0.75,
    untappedCreatures: 1.5,
    lands: 4.5,
    landCap: 7,
    extraLands: 2.5,
    untappedMana: 0.25,
    otherPermanents: 0.75,
    permanentManaValue: 0.5,
    loyalty: 1.25,
    counters: 0.5,
    library: 0.1,
    libraryDanger: 0,
    graveyard: 0.05,
    graveyardCastable: 1,
    energy: 0.3,
    monarch: 2,
    emblems: 3,
    commanderTax: 0.5,
    nonlandMana: 0,
    drawEngines: 0,
    commanderOnBoard: 0,
    idlePower: 0,
    // Frozen before the token cap: its old uncapped count, exactly.
    extraTokens: 0.75,
    threat: 0,
    answers: 0,
    // Scored as `otherPermanents` was before one-shot tokens got their own term.
    resourceTokens: 0.75,
    tokenEngines: 0,
    earlyRemoval: 0,
    earlyMana: 0,
    smallTokens: 0,
    lifeSurplus: 0,
    opponent: 1,
    otherOpponents: 0.5,
    crackbackParanoia: 1,
    crackbackMargin: 6,
  },
};

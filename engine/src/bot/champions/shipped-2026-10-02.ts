import type { Champion } from "./index.js";

/**
 * The v2 vector live rooms seat, as `DEFAULT_WEIGHTS` stood at the end of
 * 2026-10-02, after `shipped-2026-09-27c`:
 *
 * - `resourceTokens` 0.5 — a Treasure, Clue or Food is a one-shot resource,
 *   about a mana, no longer a full permanent (`otherPermanents` 2). Counted
 *   as one, a Treasure was worth the Sol Ring it could pay for.
 * - `nonlandMana` 0 → 0.5 — a mana rock's ongoing mana counts: the behaviour
 *   sweep found Sol Ring and Signets held at the end of the bot's own turn.
 *
 * Gate scenario "spends a Treasure on Sol Ring". Read with `bot:diff`.
 */
export const SHIPPED_2026_10_02: Champion = {
  id: "shipped-2026-10-02",
  date: "2026-10-02",
  note: "DEFAULT_WEIGHTS at the end of 2026-10-02: shipped-2026-09-27c with one-shot tokens as resourceTokens 0.5 and nonlandMana 0.5",
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
    nonlandMana: 0.5,
    drawEngines: 4,
    commanderOnBoard: 3,
    idlePower: 0.5,
    extraTokens: 0,
    threat: 1,
    answers: 3,
    resourceTokens: 0.5,
    tokenEngines: 0,
    earlyRemoval: 0,
    earlyMana: 0,
    smallTokens: 0,
    lifeSurplus: 0,
    opponent: 1,
    otherOpponents: 0.5,
    crackbackParanoia: 0.5,
    crackbackMargin: 2,
    crackbackGrowth: 0,
  },
};

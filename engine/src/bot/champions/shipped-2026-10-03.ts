import type { Champion } from "./index.js";

/**
 * The v2 vector live rooms seat, as `DEFAULT_WEIGHTS` stood at the end of
 * 2026-10-03, after `shipped-2026-10-02`:
 *
 * - `tokenEngines` 0 → 2 — a creature token a round that a permanent keeps
 *   making (Hero of Bladehold, Young Pyromancer, Elspeth, Sun's Champion's
 *   +1). At 0 the token decks' engines were priced on their bodies alone.
 *
 * Gate scenario "removal takes the token engine". Benched level against
 * shipped-2026-10-02 (24.5% [20.5, 28.9], 400 four-player games).
 */
export const SHIPPED_2026_10_03: Champion = {
  id: "shipped-2026-10-03",
  date: "2026-10-03",
  note: "DEFAULT_WEIGHTS at the end of 2026-10-03: shipped-2026-10-02 with token engines priced (tokenEngines 2)",
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
    tokenEngines: 2,
    earlyRemoval: 0,
    earlyMana: 0,
    smallTokens: 0,
    lifeSurplus: 0,
    trackRecord: 0,
    opponent: 1,
    otherOpponents: 0.5,
    crackbackParanoia: 0.5,
    crackbackMargin: 2,
    crackbackGrowth: 0,
  },
};

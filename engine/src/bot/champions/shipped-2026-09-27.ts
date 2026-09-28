import type { Champion } from "./index.js";

/**
 * The v2 vector live rooms seat, as `DEFAULT_WEIGHTS` stood on 2026-09-27.
 *
 * It differs from `shipped-2026-09-26` in three weights, each the lever
 * `bot:fit-scenarios` found for one training scenario and each explained where
 * it is set in `evaluate.ts` (step 8 of `docs/plans/bot-effect-knowledge.md`):
 * `handManaValue` 0 → 0.05 (a Forest in hand was worth a Craw Wurm, so a
 * forced discard threw the Wurm away), `commanderOnBoard` 0 → 3 (it killed a
 * bigger vanilla creature rather than a commander one hit from lethal
 * commander damage) and `otherOpponents` 0.25 → 0.5 (it held its removal while
 * a trailing player's creature was the only one on the table).
 *
 * Benched against three copies of `shipped-2026-09-26`, four players, count
 * budgets (even is 25%): 26.8% [22.7, 31.4] over 399 games — level. The 400th
 * ran past the 25-minute limit: not a hang, but v2 activating a pump (Lathliss,
 * Dragon Queen's {R}) a dozen times and more a turn off a pile of Treasures,
 * each a full search of a seventy-permanent board, which v1's four-a-turn cap
 * would have stopped (BACKLOG).
 */
export const SHIPPED_2026_09_27: Champion = {
  id: "shipped-2026-09-27",
  date: "2026-09-27",
  note: "DEFAULT_WEIGHTS as shipped on 2026-09-27: hand-tuned to step 8's training scenarios; 26.8% vs shipped-2026-09-26 at 4p",
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
    drawEngines: 0,
    commanderOnBoard: 3,
    idlePower: 0.5,
    // Frozen before the token cap: its old uncapped count, exactly.
    extraTokens: 2,
    threat: 0,
    opponent: 1,
    otherOpponents: 0.5,
    crackbackParanoia: 0.5,
    crackbackMargin: 2,
  },
};

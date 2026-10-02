import type { Champion } from "./index.js";

/**
 * The v2 vector live rooms seat, as `DEFAULT_WEIGHTS` stood at the end of
 * 2026-09-27: `shipped-2026-09-27` plus two terms added that day.
 *
 * - `extraTokens` 0 — identical noncreature tokens past four count for
 *   nothing, so a pile of Treasures stops being worth farming (seed 50).
 * - `threat` 1 — opponents' creatures by the damage they could turn on us,
 *   in full from a player who attacked us last round, as a share of what we
 *   have left to lose. The lever for "kills the creature attacking it, not
 *   the leader's"; read with `bot:diff` rather than benched.
 */
export const SHIPPED_2026_09_27B: Champion = {
  id: "shipped-2026-09-27b",
  date: "2026-09-27",
  note: "DEFAULT_WEIGHTS at the end of 2026-09-27: shipped-2026-09-27 with the token cap (extraTokens 0) and threat 1",
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
    extraTokens: 0,
    threat: 1,
    answers: 0,
    // Scored as `otherPermanents` was before one-shot tokens got their own term.
    resourceTokens: 2,
    opponent: 1,
    otherOpponents: 0.5,
    crackbackParanoia: 0.5,
    crackbackMargin: 2,
  },
};

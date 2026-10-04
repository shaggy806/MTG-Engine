import type { Champion } from "./index.js";

/**
 * The v2 vector live rooms seat, as `DEFAULT_WEIGHTS` stood on 2026-09-26.
 *
 * It differs from `shipped-2026-09-23` in three weights, each explained where
 * it is set in `evaluate.ts` and in `docs/plans/bot-effect-knowledge.md`
 * (step 5): `idlePower` 0 → 0.5 (equal to `power`, which it cancels for a
 * creature that can't attack — at zero, v2 pacified its own tapped creature),
 * and `life` 1 → 0.5 with `lifeDanger` 0 → 1 (a point of life costs 0.5 above
 * 15 and 1.5 below — with every point worth half a card, Read the Bones and
 * Sign in Blood scored exactly zero and were never cast).
 *
 * Benched, each against three copies of `shipped-2026-09-23` at four players,
 * 400 games, count budgets (even is 25%): `idlePower` 0.5 together with three
 * terms left at zero here, 26.0% [21.9, 30.5]; the two life weights alone,
 * 24.8% [20.8, 29.2]. Not benched as one vector. Neither number is a strength
 * result — 400 four-player games resolve about ±4 points — what they rule out
 * is a loss that size, and each change ships for the blunder its scenario
 * shows.
 */
export const SHIPPED_2026_09_26: Champion = {
  id: "shipped-2026-09-26",
  date: "2026-09-26",
  note: "DEFAULT_WEIGHTS as shipped on 2026-09-26: idlePower 0.5, life 0.5, lifeDanger 1; each part benched level with shipped-2026-09-23 at 4p",
  weights: {
    life: 0.5,
    lifeDanger: 1,
    commanderDamage: 2,
    hand: 2,
    handManaValue: 0,
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
    commanderOnBoard: 0,
    idlePower: 0.5,
    // Frozen before the token cap: its old uncapped count, exactly.
    extraTokens: 2,
    threat: 0,
    answers: 0,
    // Scored as `otherPermanents` was before one-shot tokens got their own term.
    resourceTokens: 2,
    tokenEngines: 0,
    earlyRemoval: 0,
    opponent: 1,
    otherOpponents: 0.25,
    crackbackParanoia: 0.5,
    crackbackMargin: 2,
  },
};

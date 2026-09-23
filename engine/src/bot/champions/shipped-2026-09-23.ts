import type { Champion } from "./index.js";

/**
 * The v2 vector live rooms seat, as `DEFAULT_WEIGHTS` stood on 2026-09-23.
 *
 * It had shipped without being frozen, although this pool is meant to hold
 * every vector that has ever shipped, so "measure against the bot people
 * actually play" had no `--opponent` to name. It differs from
 * `baseline-2026-09-17` in two weights, each explained where it is set in
 * `evaluate.ts`: `power` 1.5 → 0.5 (a sweep at four players peaked there) and
 * `otherPermanents` 0.5 → 2 (below `hand`, casting a mana rock scored as a
 * loss).
 *
 * Benched at freeze time (`bot:bench`, 4 workers, live-room Commander rules):
 * 88.3% [84.7, 91.0] over 400 two-player games and 60.0% [50.2, 69.1] over 100
 * four-player games against v1 (even is 50% and 25%). The four-player run was
 * interrupted after 18 games and resumed from its `--checkpoint`.
 */
export const SHIPPED_2026_09_23: Champion = {
  id: "shipped-2026-09-23",
  date: "2026-09-23",
  note: "DEFAULT_WEIGHTS as shipped on 2026-09-23; 88.3% at 2p / 60.0% at 4p vs v1",
  weights: {
    life: 1,
    lifeDanger: 0,
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
    opponent: 1,
    otherOpponents: 0.25,
    crackbackParanoia: 0.5,
    crackbackMargin: 2,
  },
};

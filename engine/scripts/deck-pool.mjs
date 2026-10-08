// Which decks `deck-winrates.mjs` deals tables from, shared with its worker
// (which inherits the environment): every starter deck, or with `--pool
// upgraded` the five Tarkir: Dragonstorm precons beside their upgrades
// (`UPGRADED_DECKS`), to measure what an upgrade is worth.
import { SAMPLE_DECKS, UPGRADED_DECKS } from "../dist/index.js";

export const DECK_POOL = process.env.DECK_POOL === "upgraded"
  ? [...SAMPLE_DECKS.filter((d) => UPGRADED_DECKS.some((u) => u.upgradeOf === d.name)), ...UPGRADED_DECKS]
  : SAMPLE_DECKS;

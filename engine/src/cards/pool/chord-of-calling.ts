import { defineCard } from "../define.js";

/** Convoke pays for X as well as the green pips (rule 702.51a — each creature
 * tapped pays {1} or one mana of its colour, and X is generic once chosen).
 * `min: 0` because a search for a card with a stated quality may find
 * nothing (rule 701.19b); "mana value X or less" reads the spell's X. */
export default defineCard({
  name: "Chord of Calling",
  manaCost: "{X}{G}{G}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Convoke\nSearch your library for a creature card with mana value X or less, " +
    "put it onto the battlefield, then shuffle.",
  convoke: true,
  effect: {
    kind: "search-library",
    filter: { type: "creature", manaValue: { op: "lte", n: "x" } },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
});

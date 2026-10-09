import { defineCard } from "../define.js";

/** Chord of Calling's search, narrowed to green: `min: 0` because a search
 * for a card with a stated quality may find nothing (rule 701.23b), and
 * "mana value X or less" reads the spell's X. */
export default defineCard({
  name: "Green Sun's Zenith",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library for a green creature card with mana value X or less, put it onto " +
    "the battlefield, then shuffle. Shuffle Green Sun's Zenith into its owner's library.",
  effect: {
    kind: "search-library",
    filter: { type: "creature", colors: ["G"], manaValue: { op: "lte", n: "x" } },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
  // Only on resolving: a countered one goes to the graveyard (the 2016-06-08
  // ruling), since the shuffle is part of what the spell never got to do.
  shuffleIntoLibraryOnResolve: true,
});

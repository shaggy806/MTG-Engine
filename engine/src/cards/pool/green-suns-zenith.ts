import { defineCard } from "../define.js";

export default defineCard({
  name: "Green Sun's Zenith",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library for a green creature card with mana value X or less, put it onto " +
    "the battlefield, then shuffle. Shuffle Green Sun's Zenith into its owner's library.",
  // The search filter compares against this spell's own X, and a library
  // search doesn't read `n: "x"` (its filter is matched without the spell's
  // X), so the number is written in here — Finale of Devastation's shape.
  resolve: (ctx) => {
    ctx.searchLibrary(
      null,
      { type: "creature", colors: ["G"], manaValue: { op: "lte", n: ctx.x } },
      "battlefield",
      0,
      1,
      false,
    );
  },
  // Only on resolving: a countered one goes to the graveyard (the 2016-06-08
  // ruling), since the shuffle is part of what the spell never got to do.
  shuffleIntoLibraryOnResolve: true,
});

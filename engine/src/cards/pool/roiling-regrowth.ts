import { defineCard } from "../define.js";

// The sacrifice is part of the effect, not a cost: with no land to
// sacrifice, the search still happens.
export default defineCard({
  name: "Roiling Regrowth",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Sacrifice a land. Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "you", filter: { type: "land" }, count: 1 },
      {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 2,
        enterTapped: true,
      },
    ],
  },
});

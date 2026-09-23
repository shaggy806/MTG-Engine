import { defineCard } from "../define.js";

// Any land card, basic or not (2009 ruling). A search for a card with a
// stated quality may come up empty (rule 701.19b), hence `min: 0`. Only the
// front face counts in a library, so a spell // land MDFC isn't a land card
// here.
export default defineCard({
  name: "Expedition Map",
  manaCost: "{1}",
  types: ["artifact"],
  text:
    "{2}, {T}, Sacrifice this artifact: Search your library for a land card, reveal it, put it into your hand, then shuffle.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text:
        "{2}, {T}, Sacrifice this artifact: Search your library for a land card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});

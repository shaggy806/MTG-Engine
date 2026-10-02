import { defineCard } from "../define.js";

// needed-cards P8 — an additional cost (rule 601.2f): the land is sacrificed as
// Harrow is *cast*, so it's gone even if Harrow is countered. The two basics
// enter untapped: sacrifice one land, get two ready to tap, so it's ramp at
// instant speed. They aren't land drops (2004-10-04 ruling).
export default defineCard({
  name: "Harrow",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a land.\n" +
    "Search your library for up to two basic land cards, put them onto the " +
    "battlefield, then shuffle.",
  additionalCost: { sacrifice: { type: "land" } },
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "battlefield",
    min: 0,
    max: 2,
  },
});

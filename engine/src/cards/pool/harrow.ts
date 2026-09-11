import { defineCard } from "../define.js";

// needed-cards P8 — an additional cost (rule 601.2f): the land is sacrificed as
// Harrow is *cast*, so it's gone even if Harrow is countered. The two basics
// enter tapped, so this is mana-neutral-but-fixing, not ramp.
export default defineCard({
  name: "Harrow",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a land.\n" +
    "Search your library for up to two basic land cards, put them onto the " +
    "battlefield tapped, then shuffle.",
  additionalCost: { sacrifice: { type: "land" } },
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    destination: "battlefield",
    min: 0,
    max: 2,
    enterTapped: true,
  },
});

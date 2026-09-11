import { defineCard } from "../define.js";

// needed-cards P8. The sacrifice is paid *after* mana (rule 601.2g — mana
// abilities are activated before costs are paid), so the classic "tap your only
// Forest for {G}, then sacrifice that same Forest" line works.
export default defineCard({
  name: "Crop Rotation",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a land.\n" +
    "Search your library for a land card, put it onto the battlefield, then shuffle.",
  additionalCost: { sacrifice: { type: "land" } },
  effect: {
    kind: "search-library",
    filter: { type: "land" },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
});

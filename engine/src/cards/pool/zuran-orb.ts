import { defineCard } from "../define.js";

// needed-cards P6 — a filtered sacrifice as an activated-ability cost
// (`AbilityCost.sacrifice: { filter }`).
export default defineCard({
  name: "Zuran Orb",
  manaCost: "{0}",
  types: ["artifact"],
  text: "Sacrifice a land: You gain 2 life.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 2, who: "you" },
      resolve: null,
      text: "Sacrifice a land: You gain 2 life.",
    },
  ],
});

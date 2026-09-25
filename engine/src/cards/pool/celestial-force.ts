import { defineCard } from "../define.js";

export default defineCard({
  name: "Celestial Force",
  manaCost: "{5}{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 7,
  toughness: 7,
  text: "At the beginning of each upkeep, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "At the beginning of each upkeep, you gain 3 life.",
    },
  ],
});

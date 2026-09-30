import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your upkeep, you lose 1 life and create a 1/1 blue and black Faerie creature token with flying.";

export default defineCard({
  name: "Bitterbloom Bearer",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "you" },
          { kind: "create-token", token: "Blue-Black Faerie Token", count: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});

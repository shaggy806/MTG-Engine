import { defineCard } from "../define.js";

const TEXT = "At the beginning of each player's draw step, that player draws an additional card.";

export default defineCard({
  name: "Dictate of Kruphix",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  keywords: ["flash"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "active-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});

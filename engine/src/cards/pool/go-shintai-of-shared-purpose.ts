import { defineCard } from "../define.js";

// EDHREC rank 5407.
// Makes Spirit → use "Spirit Token (Colorless)".

export default defineCard({
  name: "Go-Shintai of Shared Purpose",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Shrine"],
  power: 1,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nAt the beginning of your end step, you may pay {1}. If you do, create a 1/1 colorless Spirit creature token for each Shrine you control.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to create a Spirit for each Shrine you control?",
        cost: "{1}",
        effect: {
          kind: "create-token",
          token: "Spirit Token (Colorless)",
          count: { countOf: { subtype: "Shrine", controlledBy: "you" } },
        },
      },
      resolve: null,
      text: "At the beginning of your end step, you may pay {1}. If you do, create a 1/1 colorless Spirit creature token for each Shrine you control.",
    },
  ],
});

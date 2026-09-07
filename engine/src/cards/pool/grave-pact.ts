import { defineCard } from "../define.js";

export default defineCard({
  name: "Grave Pact",
  manaCost: "{1}{B}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever a creature you control dies, each other player sacrifices a creature.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "each-opponent",
        filter: { type: "creature" },
        count: 1,
      },
      resolve: null,
      text: "Whenever a creature you control dies, each other player sacrifices a creature.",
    },
  ],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Moonlit Wake",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Whenever a creature dies, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever a creature dies, you gain 1 life.",
    },
  ],
});

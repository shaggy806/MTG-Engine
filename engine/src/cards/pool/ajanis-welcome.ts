import { defineCard } from "../define.js";

export default defineCard({
  name: "Ajani's Welcome",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Whenever a creature you control enters, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever a creature you control enters, you gain 1 life.",
    },
  ],
});

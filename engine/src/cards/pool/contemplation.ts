import { defineCard } from "../define.js";

export default defineCard({
  name: "Contemplation",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Whenever you cast a spell, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever you cast a spell, you gain 1 life.",
    },
  ],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Psychic Corrosion",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever you draw a card, each opponent mills two cards.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "mill", target: "each-opponent", amount: 2 },
      resolve: null,
      text: "Whenever you draw a card, each opponent mills two cards.",
    },
  ],
});

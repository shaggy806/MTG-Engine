import { defineCard } from "../define.js";

export default defineCard({
  name: "Enchantress's Presence",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever you cast an enchantment spell, draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast an enchantment spell, draw a card.",
    },
  ],
});

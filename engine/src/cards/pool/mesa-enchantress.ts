import { defineCard } from "../define.js";

export default defineCard({
  name: "Mesa Enchantress",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 0,
  toughness: 2,
  text: "Whenever you cast an enchantment spell, you may draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever you cast an enchantment spell, you may draw a card.",
    },
  ],
});

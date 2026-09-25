import { defineCard } from "../define.js";

export default defineCard({
  name: "Satyr Enchanter",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Satyr", "Druid"],
  power: 2,
  toughness: 2,
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

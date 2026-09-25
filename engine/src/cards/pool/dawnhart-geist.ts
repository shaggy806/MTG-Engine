import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawnhart Geist",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Warlock"],
  power: 1,
  toughness: 3,
  text: "Whenever you cast an enchantment spell, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever you cast an enchantment spell, you gain 2 life.",
    },
  ],
});

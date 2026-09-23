import { defineCard } from "../define.js";

export default defineCard({
  name: "Tuvasa the Sunlit",
  manaCost: "{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Shaman"],
  power: 1,
  toughness: 1,
  text:
    "Tuvasa gets +1/+1 for each enchantment you control.\n" +
    "Whenever you cast your first enchantment spell each turn, draw a card.",
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { type: "enchantment", controlledBy: "you" }, pt: [1, 1] },
      text: "Tuvasa gets +1/+1 for each enchantment you control.",
    },
  ],
  triggered: [
    {
      // The first *enchantment* spell, which needn't be the first spell.
      trigger: { on: "cast-spell", who: "you", firstEachTurn: true, filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast your first enchantment spell each turn, draw a card.",
    },
  ],
});

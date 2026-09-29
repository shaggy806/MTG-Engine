import { defineCard } from "../define.js";

export default defineCard({
  name: "Jukai Naturalist",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  types: ["enchantment", "creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink\nEnchantment spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "enchantment", controlledBy: "you" }, reduceGeneric: 1 },
      text: "Enchantment spells you cast cost {1} less to cast.",
    },
  ],
});

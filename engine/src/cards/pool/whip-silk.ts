import { defineCard } from "../define.js";

export default defineCard({
  name: "Whip Silk",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has reach. (It can block creatures with flying.)\n{G}: Return this Aura to its owner's hand.",
  targets: ["creature"],
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{G}: Return this Aura to its owner's hand.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["reach"],
      text: "Enchanted creature has reach.",
    },
  ],
});

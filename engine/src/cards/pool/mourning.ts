import { defineCard } from "../define.js";

export default defineCard({
  name: "Mourning",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -2/-0.\n{B}: Return this Aura to its owner's hand.",
  targets: ["creature"],
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{B}: Return this Aura to its owner's hand.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-2, 0],
      text: "Enchanted creature gets -2/-0.",
    },
  ],
});

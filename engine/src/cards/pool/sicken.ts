import { defineCard } from "../define.js";

export default defineCard({
  name: "Sicken",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  cycling: { cost: "{2}" },
  text: "Enchant creature\nEnchanted creature gets -1/-1.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-1, -1],
      text: "Enchanted creature gets -1/-1.",
    },
  ],
});

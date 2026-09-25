import { defineCard } from "../define.js";

export default defineCard({
  name: "Zephid's Embrace",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has flying and shroud. (It can't be the target of spells or abilities.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["flying", "shroud"],
      text: "Enchanted creature gets +2/+2 and has flying and shroud.",
    },
  ],
});

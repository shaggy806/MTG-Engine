import { defineCard } from "../define.js";

export default defineCard({
  name: "Cursed Flesh",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets -1/-1 and has fear. (It can't be blocked except by artifact creatures and/or black creatures.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-1, -1],
      grantKeywords: ["fear"],
      text: "Enchanted creature gets -1/-1 and has fear.",
    },
  ],
});

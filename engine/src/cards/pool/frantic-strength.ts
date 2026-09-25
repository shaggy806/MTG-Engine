import { defineCard } from "../define.js";

export default defineCard({
  name: "Frantic Strength",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets +2/+2 and has trample.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +2/+2 and has trample.",
    },
  ],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Stoneskin",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets +0/+10.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [0, 10],
      text: "Enchanted creature gets +0/+10.",
    },
  ],
});

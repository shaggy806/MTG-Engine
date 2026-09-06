import { defineCard } from "../define.js";

export default defineCard({
  name: "Holy Strength",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature. Enchanted creature gets +1/+2.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 2],
      text: "Enchanted creature gets +1/+2.",
    },
  ],
});

import { defineCard } from "../define.js";

// Every other enchantment, whoever controls it; the count is live.
export default defineCard({
  name: "Ancestral Mask",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 for each other enchantment on the battlefield.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "enchantment" }, pt: [2, 2], excludeSelf: true },
      text: "Enchanted creature gets +2/+2 for each other enchantment on the battlefield.",
    },
  ],
});

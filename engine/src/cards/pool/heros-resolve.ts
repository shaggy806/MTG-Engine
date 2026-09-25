import { defineCard } from "../define.js";

export default defineCard({
  name: "Hero's Resolve",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+5.",
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [1, 5], text: "Enchanted creature gets +1/+5." }],
});

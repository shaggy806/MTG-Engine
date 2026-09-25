import { defineCard } from "../define.js";

export default defineCard({
  name: "Siegecraft",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+4.",
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 4], text: "Enchanted creature gets +2/+4." }],
});

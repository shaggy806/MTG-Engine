import { defineCard } from "../define.js";

export default defineCard({
  name: "Unholy Strength",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+1.",
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 1], text: "Enchanted creature gets +2/+1." }],
});

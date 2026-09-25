import { defineCard } from "../define.js";

export default defineCard({
  name: "Feast of the Unicorn",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +4/+0.",
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [4, 0], text: "Enchanted creature gets +4/+0." }],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Feral Invocation",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nEnchant creature\nEnchanted creature gets +2/+2.",
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 2], text: "Enchanted creature gets +2/+2." }],
});

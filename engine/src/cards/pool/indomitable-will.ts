import { defineCard } from "../define.js";

export default defineCard({
  name: "Indomitable Will",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nEnchant creature\nEnchanted creature gets +1/+2.",
  targets: ["creature"],
  static: [{ affects: { scope: "attached" }, grantPt: [1, 2], text: "Enchanted creature gets +1/+2." }],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Slimebind",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nEnchant creature\nEnchanted creature gets -4/-0.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [-4, 0],
      text: "Enchanted creature gets -4/-0.",
    },
  ],
});

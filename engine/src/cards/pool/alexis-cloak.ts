import { defineCard } from "../define.js";

export default defineCard({
  name: "Alexi's Cloak",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature has shroud. (It can't be the target of spells or abilities.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["shroud"],
      text: "Enchanted creature has shroud.",
    },
  ],
});

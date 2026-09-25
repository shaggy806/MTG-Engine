import { defineCard } from "../define.js";

export default defineCard({
  name: "Messenger's Speed",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has trample and haste.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["trample", "haste"],
      text: "Enchanted creature has trample and haste.",
    },
  ],
});

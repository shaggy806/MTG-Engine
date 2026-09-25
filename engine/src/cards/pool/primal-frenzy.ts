import { defineCard } from "../define.js";

export default defineCard({
  name: "Primal Frenzy",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has trample.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["trample"],
      text: "Enchanted creature has trample.",
    },
  ],
});

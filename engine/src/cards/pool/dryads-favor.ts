import { defineCard } from "../define.js";

export default defineCard({
  name: "Dryad's Favor",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has forestwalk. (It can't be blocked as long as defending player controls a Forest.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["forestwalk"],
      text: "Enchanted creature has forestwalk.",
    },
  ],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Tiger Claws",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: "Flash\nEnchant creature\nEnchanted creature gets +1/+1 and has trample.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +1/+1 and has trample.",
    },
  ],
});

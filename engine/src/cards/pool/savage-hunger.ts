import { defineCard } from "../define.js";

export default defineCard({
  name: "Savage Hunger",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  cycling: { cost: "{2}" },
  text: "Enchant creature\nEnchanted creature gets +1/+0 and has trample.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["trample"],
      text: "Enchanted creature gets +1/+0 and has trample.",
    },
  ],
});

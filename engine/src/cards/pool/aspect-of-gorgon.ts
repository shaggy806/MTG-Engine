import { defineCard } from "../define.js";

export default defineCard({
  name: "Aspect of Gorgon",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +1/+3 and has deathtouch. (Any amount of damage it deals to a creature is enough to destroy it.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 3],
      grantKeywords: ["deathtouch"],
      text: "Enchanted creature gets +1/+3 and has deathtouch.",
    },
  ],
});

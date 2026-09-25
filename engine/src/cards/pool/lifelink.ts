import { defineCard } from "../define.js";

export default defineCard({
  name: "Lifelink",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature has lifelink. (Damage dealt by the creature also causes its controller to gain that much life.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["lifelink"],
      text: "Enchanted creature has lifelink.",
    },
  ],
});

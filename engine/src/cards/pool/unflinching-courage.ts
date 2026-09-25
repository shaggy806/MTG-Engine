import { defineCard } from "../define.js";

export default defineCard({
  name: "Unflinching Courage",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nEnchanted creature gets +2/+2 and has trample and lifelink. (Damage dealt by the creature also causes its controller to gain that much life.)",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      grantKeywords: ["trample", "lifelink"],
      text: "Enchanted creature gets +2/+2 and has trample and lifelink.",
    },
  ],
});

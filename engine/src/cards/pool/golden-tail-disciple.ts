import { defineCard } from "../define.js";

export default defineCard({
  name: "Golden-Tail Disciple",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Fox", "Monk"],
  power: 2,
  toughness: 3,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

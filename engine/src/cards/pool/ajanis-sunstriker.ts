import { defineCard } from "../define.js";

export default defineCard({
  name: "Ajani's Sunstriker",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

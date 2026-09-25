import { defineCard } from "../define.js";

export default defineCard({
  name: "Healer's Hawk",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "lifelink"],
  text: "Flying\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

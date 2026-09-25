import { defineCard } from "../define.js";

export default defineCard({
  name: "Trained Caracal",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

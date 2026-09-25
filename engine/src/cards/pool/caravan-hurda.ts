import { defineCard } from "../define.js";

export default defineCard({
  name: "Caravan Hurda",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 1,
  toughness: 5,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

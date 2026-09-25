import { defineCard } from "../define.js";

export default defineCard({
  name: "Sungrace Pegasus",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Pegasus"],
  power: 1,
  toughness: 2,
  keywords: ["flying", "lifelink"],
  text: "Flying\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

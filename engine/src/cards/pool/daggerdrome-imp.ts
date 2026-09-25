import { defineCard } from "../define.js";

export default defineCard({
  name: "Daggerdrome Imp",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "lifelink"],
  text: "Flying\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

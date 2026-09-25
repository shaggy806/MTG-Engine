import { defineCard } from "../define.js";

export default defineCard({
  name: "Knight of Meadowgrain",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kithkin", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike", "lifelink"],
  text: "First strike\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

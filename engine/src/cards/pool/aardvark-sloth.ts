import { defineCard } from "../define.js";

export default defineCard({
  name: "Aardvark Sloth",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Sloth", "Beast"],
  power: 3,
  toughness: 3,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

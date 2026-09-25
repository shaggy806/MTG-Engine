import { defineCard } from "../define.js";

export default defineCard({
  name: "Mesa Unicorn",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Unicorn"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

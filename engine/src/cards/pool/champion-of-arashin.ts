import { defineCard } from "../define.js";

export default defineCard({
  name: "Champion of Arashin",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog", "Warrior"],
  power: 3,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

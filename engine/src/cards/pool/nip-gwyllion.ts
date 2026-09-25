import { defineCard } from "../define.js";

export default defineCard({
  name: "Nip Gwyllion",
  manaCost: "{W/B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Hag"],
  power: 1,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)",
});

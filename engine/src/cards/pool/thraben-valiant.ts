import { defineCard } from "../define.js";

export default defineCard({
  name: "Thraben Valiant",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  keywords: ["vigilance"],
  text: "Vigilance",
});

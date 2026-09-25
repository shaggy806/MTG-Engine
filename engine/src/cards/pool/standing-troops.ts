import { defineCard } from "../define.js";

export default defineCard({
  name: "Standing Troops",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance",
});

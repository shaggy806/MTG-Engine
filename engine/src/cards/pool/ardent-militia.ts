import { defineCard } from "../define.js";

export default defineCard({
  name: "Ardent Militia",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 5,
  keywords: ["vigilance"],
  text: "Vigilance",
});

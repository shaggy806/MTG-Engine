import { defineCard } from "../define.js";

export default defineCard({
  name: "Woodland Patrol",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 3,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Lonesome Unicorn",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Unicorn"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance",
  faces: ["Lonesome Unicorn", "Rider in Need"],
  adventure: true,
});

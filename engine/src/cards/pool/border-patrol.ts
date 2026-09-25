import { defineCard } from "../define.js";

export default defineCard({
  name: "Border Patrol",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Nomad"],
  power: 1,
  toughness: 6,
  keywords: ["vigilance"],
  text: "Vigilance",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Story Seeker",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink",
});

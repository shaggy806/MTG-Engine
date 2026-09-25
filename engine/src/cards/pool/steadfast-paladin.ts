import { defineCard } from "../define.js";

export default defineCard({
  name: "Steadfast Paladin",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["lifelink"],
  text: "Lifelink",
});

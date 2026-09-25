import { defineCard } from "../define.js";

export default defineCard({
  name: "Yotian Medic",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Soldier"],
  power: 1,
  toughness: 4,
  keywords: ["lifelink"],
  text: "Lifelink",
});

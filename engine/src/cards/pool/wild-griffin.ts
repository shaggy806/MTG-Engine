import { defineCard } from "../define.js";

export default defineCard({
  name: "Wild Griffin",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});

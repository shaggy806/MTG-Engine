import { defineCard } from "../define.js";

export default defineCard({
  name: "Armored Griffin",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});

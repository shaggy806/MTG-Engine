import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Revenant",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Spirit"],
  power: 3,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});

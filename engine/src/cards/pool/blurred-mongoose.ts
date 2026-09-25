import { defineCard } from "../define.js";

export default defineCard({
  name: "Blurred Mongoose",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Mongoose"],
  power: 2,
  toughness: 1,
  keywords: ["shroud"],
  cantBeCountered: true,
  text: "This spell can't be countered.\nShroud (This creature can't be the target of spells or abilities.)",
});

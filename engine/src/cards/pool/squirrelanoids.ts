import { defineCard } from "../define.js";

export default defineCard({
  name: "Squirrelanoids",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Squirrel", "Mutant"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch",
});

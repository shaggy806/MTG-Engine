import { defineCard } from "../define.js";

export default defineCard({
  name: "Scarlet Witch, Wanda Maximoff",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Warlock", "Hero"],
  power: 2,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});

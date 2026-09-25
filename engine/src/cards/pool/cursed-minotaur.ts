import { defineCard } from "../define.js";

export default defineCard({
  name: "Cursed Minotaur",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Minotaur"],
  power: 3,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});

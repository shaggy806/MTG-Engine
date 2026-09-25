import { defineCard } from "../define.js";

export default defineCard({
  name: "Monster Mashup",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Werewolf", "Fish", "Zombie", "Vampire"],
  power: 4,
  toughness: 3,
  keywords: ["reach", "menace"],
  text: "Reach (This creature can block creatures with flying.)\nMenace (This creature can't be blocked except by two or more creatures.)",
});

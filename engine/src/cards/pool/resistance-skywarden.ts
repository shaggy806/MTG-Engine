import { defineCard } from "../define.js";

export default defineCard({
  name: "Resistance Skywarden",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Rebel"],
  power: 5,
  toughness: 5,
  keywords: ["reach", "menace"],
  text: "Reach (This creature can block creatures with flying.)\nMenace (This creature can't be blocked except by two or more creatures.)",
});

import { defineCard } from "../define.js";

// Aya of Alexandria's 1/1 black Assassin with menace.
export default defineCard({
  name: "Assassin Token (Aya of Alexandria)",
  art: "19cb2062-86f0-4ce3-b5fb-d3c310f36ec3",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Assassin"],
  power: 1,
  toughness: 1,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)",
});

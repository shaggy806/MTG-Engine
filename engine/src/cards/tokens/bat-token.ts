import { defineCard } from "../define.js";

// Lunar Convocation's Bat token: a 1/1 black Bat creature token with flying.

export default defineCard({
  name: "Bat Token",
  art: "100c0127-49dd-4a78-9c88-1881e7923674",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Bat"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying",
});

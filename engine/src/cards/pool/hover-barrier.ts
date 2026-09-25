import { defineCard } from "../define.js";

export default defineCard({
  name: "Hover Barrier",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion", "Wall"],
  power: 0,
  toughness: 6,
  keywords: ["defender", "flying"],
  text: "Defender, flying",
});

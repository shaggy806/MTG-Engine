import { defineCard } from "../define.js";

export default defineCard({
  name: "Talas Scout",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Pirate", "Scout"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Zodiac Goat",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goat"],
  power: 1,
  toughness: 1,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)",
});

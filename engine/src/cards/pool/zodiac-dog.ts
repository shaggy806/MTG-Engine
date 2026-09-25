import { defineCard } from "../define.js";

export default defineCard({
  name: "Zodiac Dog",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 2,
  toughness: 2,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)",
});

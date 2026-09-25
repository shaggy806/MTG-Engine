import { defineCard } from "../define.js";

export default defineCard({
  name: "Canyon Wildcat",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 1,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)",
});

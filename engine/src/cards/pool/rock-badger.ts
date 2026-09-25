import { defineCard } from "../define.js";

export default defineCard({
  name: "Rock Badger",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Badger", "Beast"],
  power: 3,
  toughness: 3,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Benthic Behemoth",
  manaCost: "{5}{U}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 7,
  toughness: 6,
  keywords: ["islandwalk"],
  text: "Islandwalk (This creature can't be blocked as long as defending player controls an Island.)",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Devouring Deep",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Fish"],
  power: 1,
  toughness: 2,
  keywords: ["islandwalk"],
  text: "Islandwalk (This creature can't be blocked as long as defending player controls an Island.)",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Grayscaled Gharial",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Crocodile"],
  power: 1,
  toughness: 1,
  keywords: ["islandwalk"],
  text: "Islandwalk (This creature can't be blocked as long as defending player controls an Island.)",
});

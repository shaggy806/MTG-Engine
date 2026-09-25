import { defineCard } from "../define.js";

export default defineCard({
  name: "Pale Bears",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 2,
  toughness: 2,
  keywords: ["islandwalk"],
  text: "Islandwalk (This creature can't be blocked as long as defending player controls an Island.)",
});

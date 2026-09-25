import { defineCard } from "../define.js";

export default defineCard({
  name: "Bull Hippo",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hippo"],
  power: 3,
  toughness: 3,
  keywords: ["islandwalk"],
  text: "Islandwalk (This creature can't be blocked as long as defending player controls an Island.)",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Plague Beetle",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});

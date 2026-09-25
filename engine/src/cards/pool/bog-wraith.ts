import { defineCard } from "../define.js";

export default defineCard({
  name: "Bog Wraith",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wraith"],
  power: 3,
  toughness: 3,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});

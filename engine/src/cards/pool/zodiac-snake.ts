import { defineCard } from "../define.js";

export default defineCard({
  name: "Zodiac Snake",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 2,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});

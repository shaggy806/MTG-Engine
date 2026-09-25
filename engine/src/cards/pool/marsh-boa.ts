import { defineCard } from "../define.js";

export default defineCard({
  name: "Marsh Boa",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 1,
  toughness: 1,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});

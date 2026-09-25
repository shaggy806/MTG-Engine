import { defineCard } from "../define.js";

export default defineCard({
  name: "Wild Ox",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ox"],
  power: 3,
  toughness: 3,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});

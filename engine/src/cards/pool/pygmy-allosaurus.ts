import { defineCard } from "../define.js";

export default defineCard({
  name: "Pygmy Allosaurus",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 2,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});

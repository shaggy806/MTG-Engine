import { defineCard } from "../define.js";

export default defineCard({
  name: "Slinking Serpent",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 2,
  toughness: 3,
  keywords: ["forestwalk"],
  text: "Forestwalk (This creature can't be blocked as long as defending player controls a Forest.)",
});

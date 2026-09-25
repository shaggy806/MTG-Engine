import { defineCard } from "../define.js";

export default defineCard({
  name: "Leaf Dancer",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Centaur"],
  power: 2,
  toughness: 2,
  keywords: ["forestwalk"],
  text: "Forestwalk (This creature can't be blocked as long as defending player controls a Forest.)",
});

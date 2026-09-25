import { defineCard } from "../define.js";

export default defineCard({
  name: "The Fabulous Frog-Man",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Hero"],
  power: 3,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});

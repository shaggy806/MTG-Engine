import { defineCard } from "../define.js";

export default defineCard({
  name: "Nimble Birdsticker",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});

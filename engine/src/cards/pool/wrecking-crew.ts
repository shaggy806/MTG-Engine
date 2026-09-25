import { defineCard } from "../define.js";

export default defineCard({
  name: "Wrecking Crew",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 4,
  toughness: 5,
  keywords: ["reach", "trample"],
  text: "Reach (This creature can block creatures with flying.)\nTrample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)",
});

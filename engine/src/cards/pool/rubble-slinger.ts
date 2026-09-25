import { defineCard } from "../define.js";

export default defineCard({
  name: "Rubble Slinger",
  manaCost: "{2}{R/G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Roc Hunter",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 1,
  keywords: ["reach"],
  text: "Reach",
});

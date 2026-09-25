import { defineCard } from "../define.js";

export default defineCard({
  name: "Frog-Squirrels",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Frog", "Squirrel"],
  power: 2,
  toughness: 2,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)",
});

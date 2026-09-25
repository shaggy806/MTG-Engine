import { defineCard } from "../define.js";

export default defineCard({
  name: "Renegade Troops",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 4,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste",
});

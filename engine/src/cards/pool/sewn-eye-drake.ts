import { defineCard } from "../define.js";

export default defineCard({
  name: "Sewn-Eye Drake",
  manaCost: "{2}{U/R}{B}",
  colors: ["U", "B", "R"],
  types: ["creature"],
  subtypes: ["Zombie", "Drake"],
  power: 3,
  toughness: 1,
  keywords: ["flying", "haste"],
  text: "Flying, haste",
});

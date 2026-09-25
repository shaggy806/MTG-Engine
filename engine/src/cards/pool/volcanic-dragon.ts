import { defineCard } from "../define.js";

export default defineCard({
  name: "Volcanic Dragon",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: "Flying, haste",
});

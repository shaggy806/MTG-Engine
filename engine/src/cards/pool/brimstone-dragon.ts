import { defineCard } from "../define.js";

export default defineCard({
  name: "Brimstone Dragon",
  manaCost: "{6}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "haste"],
  text: "Flying, haste",
});

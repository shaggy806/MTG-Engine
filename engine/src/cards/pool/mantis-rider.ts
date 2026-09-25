import { defineCard } from "../define.js";

export default defineCard({
  name: "Mantis Rider",
  manaCost: "{U}{R}{W}",
  colors: ["W", "U", "R"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance", "haste"],
  text: "Flying, vigilance, haste",
});

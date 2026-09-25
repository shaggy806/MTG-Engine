import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Angel",
  manaCost: "{1}{U}{R}{W}",
  colors: ["W", "U", "R"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 4,
  keywords: ["flying", "vigilance", "haste"],
  text: "Flying, vigilance, haste",
});

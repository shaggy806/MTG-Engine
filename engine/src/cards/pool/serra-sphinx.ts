import { defineCard } from "../define.js";

export default defineCard({
  name: "Serra Sphinx",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});

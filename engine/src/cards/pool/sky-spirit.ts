import { defineCard } from "../define.js";

export default defineCard({
  name: "Sky Spirit",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});

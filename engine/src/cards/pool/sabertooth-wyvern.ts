import { defineCard } from "../define.js";

export default defineCard({
  name: "Sabertooth Wyvern",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 3,
  toughness: 2,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});

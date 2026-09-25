import { defineCard } from "../define.js";

export default defineCard({
  name: "Sky Terror",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "menace"],
  text: "Flying, menace",
});

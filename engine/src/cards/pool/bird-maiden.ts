import { defineCard } from "../define.js";

export default defineCard({
  name: "Bird Maiden",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Bird"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying",
});

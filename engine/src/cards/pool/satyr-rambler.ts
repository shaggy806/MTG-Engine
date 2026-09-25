import { defineCard } from "../define.js";

export default defineCard({
  name: "Satyr Rambler",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Satyr"],
  power: 2,
  toughness: 1,
  keywords: ["trample"],
  text: "Trample",
});

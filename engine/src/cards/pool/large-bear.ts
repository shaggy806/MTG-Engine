import { defineCard } from "../define.js";

export default defineCard({
  name: "Large Bear",
  manaCost: "{3}{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 5,
  toughness: 5,
  keywords: ["reach", "trample", "haste"],
  text: "Reach, trample, haste",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Ambush Party",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 3,
  toughness: 1,
  keywords: ["first-strike", "haste"],
  text: "First strike, haste",
});

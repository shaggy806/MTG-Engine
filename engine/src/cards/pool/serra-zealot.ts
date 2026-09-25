import { defineCard } from "../define.js";

export default defineCard({
  name: "Serra Zealot",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike",
});

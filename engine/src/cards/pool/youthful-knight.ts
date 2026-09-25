import { defineCard } from "../define.js";

export default defineCard({
  name: "Youthful Knight",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike",
});

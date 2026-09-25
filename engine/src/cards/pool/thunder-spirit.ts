import { defineCard } from "../define.js";

export default defineCard({
  name: "Thunder Spirit",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elemental", "Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});

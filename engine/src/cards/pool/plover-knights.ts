import { defineCard } from "../define.js";

export default defineCard({
  name: "Plover Knights",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kithkin", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});

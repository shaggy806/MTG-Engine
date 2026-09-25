import { defineCard } from "../define.js";

export default defineCard({
  name: "Kithkin Billyrider",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kithkin", "Knight"],
  power: 1,
  toughness: 3,
  keywords: ["double-strike"],
  text: "Double strike",
});

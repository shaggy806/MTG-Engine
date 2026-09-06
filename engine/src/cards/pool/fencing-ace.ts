import { defineCard } from "../define.js";

export default defineCard({
  name: "Fencing Ace",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["double-strike"],
  text: "Double strike",
});

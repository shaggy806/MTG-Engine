import { defineCard } from "../define.js";

export default defineCard({
  name: "Battlefield Raptor",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 2,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Silverclaw Griffin",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 3,
  toughness: 2,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike",
});

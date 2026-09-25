import { defineCard } from "../define.js";

export default defineCard({
  name: "Diving Griffin",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "vigilance"],
  text: "Flying, vigilance",
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Cliff Threader",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Scout"],
  power: 2,
  toughness: 1,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)",
});

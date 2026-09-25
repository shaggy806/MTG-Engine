import { defineCard } from "../define.js";

export default defineCard({
  name: "Hillcomber Giant",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Giant", "Scout"],
  power: 3,
  toughness: 3,
  keywords: ["mountainwalk"],
  text: "Mountainwalk (This creature can't be blocked as long as defending player controls a Mountain.)",
});

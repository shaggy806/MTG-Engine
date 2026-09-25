import { defineCard } from "../define.js";

export default defineCard({
  name: "Lost Soul",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit", "Minion"],
  power: 2,
  toughness: 1,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)",
});

import { defineCard } from "../define.js";

// EDHREC rank 6400.

const EVASION_TEXT = "This creature can't be blocked by creatures with power 2 or less.";

export default defineCard({
  name: "Stormkeld Vanguard",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Giant", "Warrior"],
  power: 6,
  toughness: 7,
  text: EVASION_TEXT,
  faces: ["Stormkeld Vanguard", "Bear Down"],
  adventure: true,
  static: [
    {
      affects: { scope: "self" },
      cantBeBlockedBy: { power: { op: "lte", n: 2 } },
      text: EVASION_TEXT,
    },
  ],
});

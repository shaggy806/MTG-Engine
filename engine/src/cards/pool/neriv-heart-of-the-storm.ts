import { defineCard } from "../define.js";

// #336 in top-commanders.txt.
const TEXT = "If a creature you control that entered this turn would deal damage, it deals twice that much damage instead.";

export default defineCard({
  name: "Neriv, Heart of the Storm",
  manaCost: "{1}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        multiplier: 2,
        source: { type: "creature", controlledBy: "you", enteredThisTurn: true },
      },
      text: TEXT,
    },
  ],
});

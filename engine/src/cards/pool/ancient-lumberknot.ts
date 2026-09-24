import { defineCard } from "../define.js";

// "With toughness greater than its power" is judged on each creature's
// computed P/T whenever its combat damage is sized, so a creature pumped to
// power ≥ toughness goes back to dealing its power. Only combat damage
// changes (the 2021-11-19 ruling): "damage equal to a creature's power"
// still reads the real power.
export default defineCard({
  name: "Ancient Lumberknot",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 1,
  toughness: 4,
  text:
    "Each creature you control with toughness greater than its power assigns combat damage " +
    "equal to its toughness rather than its power.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      combatDamageByToughness: "if-toughness-greater",
      text:
        "Each creature you control with toughness greater than its power assigns combat damage " +
        "equal to its toughness rather than its power.",
    },
  ],
});

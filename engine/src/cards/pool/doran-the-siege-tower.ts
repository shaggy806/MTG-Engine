import { defineCard } from "../define.js";

// "Each creature" — every creature on the battlefield, whoever controls it,
// Doran included (the 2007-10-01 ruling: "mandatory and affects all
// creatures"), so an opponent's blockers and attackers deal their toughness
// too. Only combat damage changes; nothing's power does, so a fight or
// "damage equal to its power" still reads the real power.
export default defineCard({
  name: "Doran, the Siege Tower",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Treefolk", "Shaman"],
  power: 0,
  toughness: 5,
  text: "Each creature assigns combat damage equal to its toughness rather than its power.",
  static: [
    {
      affects: { scope: "all-creatures" },
      combatDamageByToughness: "always",
      text: "Each creature assigns combat damage equal to its toughness rather than its power.",
    },
  ],
});

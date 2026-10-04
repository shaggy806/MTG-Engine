import { defineCard } from "../define.js";

// EDHREC rank 3288.
//
// Rulings:
//   [2014-09-20] A spell or ability that counters spells can still target a creature spell you
//     control. When that spell or ability resolves, the creature spell won't be countered, but any
//     additional effects of that spell or ability will still happen.

const UNCOUNTERABLE_TEXT = "Creature spells you control can't be countered.";
const TRAMPLE_TEXT = "Other creatures you control have trample.";

export default defineCard({
  name: "Surrak Dragonclaw",
  manaCost: "{2}{G}{U}{R}",
  colors: ["U", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 6,
  toughness: 6,
  keywords: ["flash"],
  cantBeCountered: true,
  text: `Flash\nThis spell can't be countered.\n${UNCOUNTERABLE_TEXT}\n${TRAMPLE_TEXT}`,
  static: [
    {
      // Prowling Serpopard's shape.
      affects: { scope: "self" },
      grantsToSpells: { filter: { type: "creature" }, cantBeCountered: true },
      text: UNCOUNTERABLE_TEXT,
    },
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
});

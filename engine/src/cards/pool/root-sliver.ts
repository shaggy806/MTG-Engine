import { defineCard } from "../define.js";

// EDHREC rank 6429.
//
// Rulings:
//   [2004-10-04] The first ability applies when this card is not on the battlefield. The second
//     ability applies when this card is on the battlefield.
//
// "Sliver spells" are every player's (Lier's `allSpells`), matched by subtype
// on the stack, so a changeling spell is one too.
const COUNTER_TEXT = "Sliver spells can't be countered.";

export default defineCard({
  name: "Root Sliver",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  cantBeCountered: true,
  text: `This spell can't be countered.\n${COUNTER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { subtype: "Sliver" }, cantBeCountered: true, allSpells: true },
      text: COUNTER_TEXT,
    },
  ],
});

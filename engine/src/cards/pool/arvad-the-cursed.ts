import { defineCard } from "../define.js";

// EDHREC rank 5092.
//
// Rulings:
//   [2018-04-27] Because damage remains marked on a creature until it's removed as the turn ends,
//     nonlethal damage dealt to a legendary creature you control may become lethal if Arvad leaves
//     the battlefield during that turn.

const ANTHEM_TEXT = "Other legendary creatures you control get +2/+2.";

export default defineCard({
  name: "Arvad the Cursed",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["deathtouch", "lifelink"],
  text: `Deathtouch, lifelink\n${ANTHEM_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
        excludeSelf: true,
      },
      grantPt: [2, 2],
      text: ANTHEM_TEXT,
    },
  ],
});

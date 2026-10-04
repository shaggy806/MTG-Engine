import { defineCard } from "../define.js";

// EDHREC rank 5105.
//
// Rulings:
//   [2010-06-15] Stalwart Shield-Bearers continually checks which creatures you control have
//     defender and gives the bonus only to them. If an effect causes a creature with defender to
//     lose defender (as Shoal Serpent does), Stalwart Shield-Bearers stops giving it the bonus for
//     as long as it doesn’t have defender. On the other hand, if a spell or ability causes a
//     creature to be able to attack as though it didn’t have defender (as Warmonger’s Chariot
//     does), Stalwart Shield-Bearers continues to give it the bonus because it never actually
//     loses the defender ability.

export default defineCard({
  name: "Stalwart Shield-Bearers",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\nOther creatures you control with defender get +0/+2.",
  static: [
    {
      affects: { scope: "creatures-you-control", withKeyword: "defender", excludeSelf: true },
      grantPt: [0, 2],
      text: "Other creatures you control with defender get +0/+2.",
    },
  ],
});

import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 4118.
//
// Rulings:
//   [2023-05-12] Once a ward ability has triggered, causing that Human to lose ward by removing
//     Coppercoat Vanguard won't affect that ability. The appropriate player will still have to pay
//     {1} or see their spell or ability countered.

const TEXT = "Each other Human you control gets +1/+0 and has ward {1}.";

export default defineCard({
  name: "Coppercoat Vanguard",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: `${TEXT} (Whenever it becomes the target of a spell or ability an opponent controls, counter it unless that player pays {1}.)`,
  static: [
    {
      // A granted ward is a real triggered ability: once it has triggered,
      // losing the grant doesn't stop it (the ruling — Gold-Forged Thopteryx's shape).
      affects: {
        scope: "filter",
        filter: { type: "creature", subtype: "Human", controlledBy: "you" },
        excludeSelf: true,
      },
      grantPt: [1, 0],
      grantsTriggered: [ward({ mana: "{1}" })],
      text: TEXT,
    },
  ],
});

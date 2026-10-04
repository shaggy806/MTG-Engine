import { defineCard } from "../define.js";

// EDHREC rank 3173.
//
// Rulings:
//   [2018-07-13] Because damage remains marked on a creature until it's removed as the turn ends,
//     nonlethal damage dealt to a Goblin you control may become lethal if Goblin Trashmaster
//     leaves the battlefield during that turn.
//   [2018-07-13] You can sacrifice Goblin Trashmaster to pay the cost for its own ability.

const ANTHEM_TEXT = "Other Goblins you control get +1/+1.";
const SAC_TEXT = "Sacrifice a Goblin: Destroy target artifact.";

export default defineCard({
  name: "Goblin Trashmaster",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${ANTHEM_TEXT}\n${SAC_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Goblin" },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  activated: [
    {
      // Itself included (the ruling): no `otherOnly`.
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Goblin" } } },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});

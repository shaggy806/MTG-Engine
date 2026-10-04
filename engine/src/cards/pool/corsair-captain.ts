import { defineCard } from "../define.js";

// EDHREC rank 5241.
// Makes Treasure → use "Treasure Token".
//
// Rulings:
//   [2020-06-23] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to Pirates you control may become lethal if Corsair
//     Captain leaves the battlefield during that turn.

export default defineCard({
  name: "Corsair Captain",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\nOther Pirates you control get +1/+1.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Treasure token.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Pirate" },
      grantPt: [1, 1],
      text: "Other Pirates you control get +1/+1.",
    },
  ],
});

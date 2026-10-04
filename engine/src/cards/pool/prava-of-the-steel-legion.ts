import { defineCard } from "../define.js";

// EDHREC rank 3926.
// Makes Soldier → use "Soldier Token".
//
// Rulings:
//   [2020-11-10] However, if Prava leaves the battlefield, its bonus immediately stops applying.
//     Nonlethal damage dealt to creature tokens you control may become lethal if Prava leaves the
//     battlefield during your turn.
//   [2020-11-10] The bonus provided by Prava's first ability will still be in effect when damage
//     is removed during the cleanup step.
//   (The rest are the general partner rulings.)

const STATIC_TEXT = "During your turn, creature tokens you control get +1/+4.";
const TOKEN_TEXT = "{3}{W}: Create a 1/1 white Soldier creature token.";

export default defineCard({
  name: "Prava of the Steel Legion",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Soldier"],
  power: 1,
  toughness: 4,
  pairing: { kind: "partner" },
  text: `${STATIC_TEXT}\n${TOKEN_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  static: [
    {
      affects: { scope: "creatures-you-control", tokenOnly: true },
      condition: { kind: "your-turn" },
      grantPt: [1, 4],
      text: STATIC_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{W}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});

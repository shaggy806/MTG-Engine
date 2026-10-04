import { defineCard } from "../define.js";

// EDHREC rank 4873.
//
// Rulings:
//   [2008-08-01] The abilities are separate and cumulative. If another creature you control is
//     both of the listed colors, it will get a total of +2/+2.

const RED_TEXT = "Other red creatures you control get +1/+1.";
const WHITE_TEXT = "Other white creatures you control get +1/+1.";
const RED_CAST_TEXT = "Whenever you cast a red spell, this creature deals 3 damage to target player or planeswalker.";
const WHITE_CAST_TEXT = "Whenever you cast a white spell, you gain 3 life.";

// Murkfiend Liege's two separate anthems (a red-and-white creature gets
// +2/+2), and Aragorn, the Uniter's colour-filtered cast triggers.
export default defineCard({
  name: "Balefire Liege",
  manaCost: "{2}{R/W}{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Spirit", "Horror"],
  power: 2,
  toughness: 4,
  text: `${RED_TEXT}\n${WHITE_TEXT}\n${RED_CAST_TEXT}\n${WHITE_CAST_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["R"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: RED_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["W"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: WHITE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["R"] } },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", target: 0, amount: 3 },
      resolve: null,
      text: RED_CAST_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["W"] } },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: WHITE_CAST_TEXT,
    },
  ],
});

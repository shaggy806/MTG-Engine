import { defineCard } from "../define.js";

// EDHREC rank 5042.
//
// Rulings:
//   [2008-05-01] The abilities are separate and cumulative. If another creature you control is
//     both of the listed colors, it will get a total of +2/+2.

const BLUE_TEXT = "Other blue creatures you control get +1/+1.";
const BLACK_TEXT = "Other black creatures you control get +1/+1.";

// Two separate anthems, so a blue-and-black creature gets +2/+2 (Murkfiend Liege's shape).
export default defineCard({
  name: "Glen Elendra Liege",
  manaCost: "{1}{U/B}{U/B}{U/B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Faerie", "Knight"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${BLUE_TEXT}\n${BLACK_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["U"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: BLUE_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["B"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: BLACK_TEXT,
    },
  ],
});

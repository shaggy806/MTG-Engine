import { defineCard } from "../define.js";

// EDHREC rank 5096.
//
// Rulings:
//   [2008-08-01] Since the token is black and green, it will get +2/+2 from Creakwood Liege as
//     long as the Liege is on the battlefield.
//   [2008-08-01] The abilities are separate and cumulative. If another creature you control is
//     both of the listed colors, it will get a total of +2/+2.

const BLACK_TEXT = "Other black creatures you control get +1/+1.";
const GREEN_TEXT = "Other green creatures you control get +1/+1.";
const WORM_TEXT = "At the beginning of your upkeep, you may create a 1/1 black and green Worm creature token.";

// The two anthems are separate (Murkfiend Liege's shape): a black-and-green
// creature gets +2/+2.
export default defineCard({
  name: "Creakwood Liege",
  manaCost: "{1}{B/G}{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 2,
  toughness: 2,
  text: `${BLACK_TEXT}\n${GREEN_TEXT}\n${WORM_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["B"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: BLACK_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["G"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: GREEN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 black and green Worm creature token?",
        effect: { kind: "create-token", token: "Worm Token", count: 1 },
      },
      resolve: null,
      text: WORM_TEXT,
    },
  ],
});

import { defineCard } from "../define.js";

// EDHREC rank 2822.

const ANTHEM_TEXT = "Green creatures you control get +1/+1.";
const SCRY_TEXT = "Whenever a green creature you control enters, scry 1.";

export default defineCard({
  name: "Sylvan Anthem",
  manaCost: "{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${ANTHEM_TEXT}\n${SCRY_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", colors: ["G"], controlledBy: "you" } },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature", colors: ["G"] } },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: SCRY_TEXT,
    },
  ],
});

import { defineCard } from "../define.js";

// EDHREC rank 2763.
//
// Rulings:
//   [2021-04-16] Being a commander is not a copiable characteristic; these effects do not apply to
//     copies of a player's commander.
//   [2021-04-16] These effects apply to any commanders you control, not just your own commander.

const PUMP_TEXT = "Commander creatures you control get +2/+2.";
const HEXPROOF_TEXT = "Commanders you control have hexproof.";

export default defineCard({
  name: "Guardian Augmenter",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Troll", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\n${PUMP_TEXT}\n${HEXPROOF_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", isCommander: true, controlledBy: "you" } },
      grantPt: [2, 2],
      text: PUMP_TEXT,
    },
    {
      affects: { scope: "filter", filter: { isCommander: true, controlledBy: "you" } },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
  ],
});

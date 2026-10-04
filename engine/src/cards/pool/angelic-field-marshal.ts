import { defineCard } from "../define.js";

// EDHREC rank 4480.
//
// Rulings:
//   [2014-11-07] Lieutenant abilities refer only to whether you control your commander, not any
//     other player’s commander.
//   [2014-11-07] Lieutenant abilities apply only if your commander is on the battlefield and under
//     your control.
//
// Thunderfoot Baloth's shape: a self-scoped +2/+2 and a "creatures you control" grant, both on
// the controls-your-own-commander condition.
const CONTROLS_COMMANDER = {
  kind: "controls",
  filter: { isCommander: true, controlledBy: "you", ownedBy: "you" },
  atLeast: 1,
} as const;

export default defineCard({
  name: "Angelic Field Marshal",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nLieutenant — As long as you control your commander, this creature gets +2/+2 and creatures you control have vigilance.",
  static: [
    {
      affects: { scope: "self" },
      condition: CONTROLS_COMMANDER,
      grantPt: [2, 2],
      text: "Lieutenant — As long as you control your commander, this creature gets +2/+2.",
    },
    {
      affects: { scope: "creatures-you-control" },
      condition: CONTROLS_COMMANDER,
      grantKeywords: ["vigilance"],
      text: "Lieutenant — As long as you control your commander, creatures you control have vigilance.",
    },
  ],
});

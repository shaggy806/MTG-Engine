import { defineCard } from "../define.js";

// EDHREC rank 5237.
//
// Rulings:
//   [2018-07-13] If you have multiple commanders, you need to control only one for the lieutenant
//     effect to happen.
//   [2018-07-13] The lieutenant effect happens only once each combat, even if you somehow control
//     multiple commanders (perhaps because you have two commanders with a partner ability from the
//     Battlebond™ set).
//   [2018-07-13] If you don’t control your commander as the lieutenant ability resolves, you won’t
//     get its effect.

const TEXT = "Lieutenant — At the beginning of combat on your turn, if you control your commander, draw a card.";

export default defineCard({
  name: "Loyal Drake",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: { kind: "controls", filter: { isCommander: true, ownedBy: "you" }, atLeast: 1 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});

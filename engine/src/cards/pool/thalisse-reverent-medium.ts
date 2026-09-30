import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of each end step, create X 1/1 white Spirit creature tokens with flying, where X is the number of tokens you created this turn.";

// A player creates only tokens that enter under their own control here, so
// the tokens that entered under yours this turn are the ones you created —
// each token of a stack counted.
export default defineCard({
  name: "Thalisse, Reverent Medium",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Spirit Token",
        count: { turnHistory: "entered", who: "you", filter: { token: true } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});

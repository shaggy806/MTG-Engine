import { defineCard } from "../define.js";

// EDHREC rank 3807.
//
// "This creature or another Human you control enters" is Coercive Recruiter's
// pair of triggers: one for itself, one (`otherOnly`) for any other Human.

const TAP_TEXT = "Whenever this creature or another Human you control enters, tap target creature an opponent controls.";

export default defineCard({
  name: "Lossarnach Captain",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 1,
  keywords: ["first-strike"],
  text: `First strike\n${TAP_TEXT}\nAt the beginning of your upkeep, create a 1/1 white Human Soldier creature token.`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: TAP_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { subtype: "Human" } },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: TAP_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, create a 1/1 white Human Soldier creature token.",
    },
  ],
});

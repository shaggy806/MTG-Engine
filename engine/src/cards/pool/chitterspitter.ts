import { defineCard } from "../define.js";

// EDHREC rank 3145.
//
// "You may sacrifice a token. If you do, …" is Yuma, Proud Protector's shape: an
// `each-player-may` for you alone, whose `ifDid` runs only when the sacrifice was made.

const UPKEEP_TEXT =
  "At the beginning of your upkeep, you may sacrifice a token. If you do, put an acorn counter on this artifact.";
const PUMP_TEXT = "Squirrels you control get +1/+1 for each acorn counter on this artifact.";
const TOKEN_TEXT = "{G}, {T}: Create a 1/1 green Squirrel creature token.";

export default defineCard({
  name: "Chitterspitter",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["artifact"],
  text: `${UPKEEP_TEXT}\n${PUMP_TEXT}\n${TOKEN_TEXT}`,
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Squirrel Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { token: true }, text: "Sacrifice a token" }],
        ifDid: { kind: "add-counter", target: "source", counter: "acorn", amount: 1 },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Squirrel", controlledBy: "you" } },
      grantPtPerCount: { countersOnSource: "acorn", pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
});

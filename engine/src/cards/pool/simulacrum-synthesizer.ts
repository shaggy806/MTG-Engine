import { defineCard } from "../define.js";

const SCRY_TEXT = "When this artifact enters, scry 2.";
const CONSTRUCT_TEXT =
  'Whenever another artifact you control with mana value 3 or greater enters, create a 0/0 colorless Construct artifact creature token with "This token gets +1/+1 for each artifact you control."';

export default defineCard({
  name: "Simulacrum Synthesizer",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: `${SCRY_TEXT}\n${CONSTRUCT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: SCRY_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "artifact", manaValue: { op: "gte", n: 3 } },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Construct Token", count: 1 },
      resolve: null,
      text: CONSTRUCT_TEXT,
    },
  ],
});

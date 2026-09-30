import { defineCard } from "../define.js";

const TRAMPLE_TEXT = "Other creatures you control have trample.";
const ENTER_TEXT =
  "Whenever another nontoken creature you control enters, put a +1/+1 counter on it. It gains haste until end of turn.";

export default defineCard({
  name: "Surrak and Goreclaw",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Bear"],
  power: 6,
  toughness: 5,
  keywords: ["trample"],
  text: `Trample\n${TRAMPLE_TEXT}\n${ENTER_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["trample"],
      text: TRAMPLE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", token: false },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
          { kind: "grant-keyword", target: "trigger-object", keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});

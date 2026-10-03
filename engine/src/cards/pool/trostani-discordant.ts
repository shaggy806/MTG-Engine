import { defineCard } from "../define.js";

const ANTHEM_TEXT = "Other creatures you control get +1/+1.";
const ENTER_TEXT = "When Trostani enters, create two 1/1 white Soldier creature tokens with lifelink.";
const END_TEXT = "At the beginning of your end step, each player gains control of all creatures they own.";

// The end-step trigger is one lasting control effect with one timestamp
// (rule 613.7b), each creature going to its own owner — so a creature stolen
// "until end of turn" or indefinitely comes home, and a later control effect
// still wins over it.
export default defineCard({
  name: "Trostani Discordant",
  manaCost: "{3}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 1,
  toughness: 4,
  text: `${ANTHEM_TEXT}\n${ENTER_TEXT}\n${END_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Soldier Token", count: 2 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "gain-control-all",
        filter: { type: "creature" },
        untilEndOfTurn: false,
        who: "owner",
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});

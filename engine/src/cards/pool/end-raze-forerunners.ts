import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, other creatures you control get +2/+2 and gain vigilance and trample until end of turn.";

const OTHERS = { type: "creature", controlledBy: "you" } as const;

// The creatures are fixed as it resolves (rule 611.2c): one arriving later
// this turn gets nothing.
export default defineCard({
  name: "End-Raze Forerunners",
  manaCost: "{5}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Boar"],
  power: 7,
  toughness: 7,
  keywords: ["vigilance", "trample", "haste"],
  text: `Vigilance, trample, haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: OTHERS, power: 2, toughness: 2, duration: "end-of-turn", exceptSource: true },
          { kind: "grant-keyword-all", filter: OTHERS, keyword: "vigilance", duration: "end-of-turn", exceptSource: true },
          { kind: "grant-keyword-all", filter: OTHERS, keyword: "trample", duration: "end-of-turn", exceptSource: true },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});

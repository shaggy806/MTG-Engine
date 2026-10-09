import { defineCard } from "../define.js";

// EDHREC rank 1203. Craterhoof Behemoth's shape: X is counted once, as the
// ability resolves, and only the creatures you control then are affected
// (the rulings).
const ENTER =
  "When this creature enters, creatures you control gain flying and get +X/+X until end of turn, where X is the number of creatures you control.";

export default defineCard({
  name: "Moonshaker Cavalry",
  manaCost: "{5}{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Knight"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${ENTER}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "flying",
            duration: "end-of-turn",
          },
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: { countOf: { type: "creature", controlledBy: "you" } },
            toughness: { countOf: { type: "creature", controlledBy: "you" } },
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: ENTER,
    },
  ],
});

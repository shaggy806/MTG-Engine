import { defineCard } from "../define.js";

const FABRICATE_TEXT =
  "Fabricate 2 (When this creature enters, put two +1/+1 counters on it or create two 1/1 colorless Servo artifact creature tokens.)";
const ANTHEM_TEXT = "Other creatures you control get +1/+1.";

// Fabricate (rule 702.123) is an enters trigger whose choice is made as it
// resolves, as Marionette Apprentice's is.
export default defineCard({
  name: "Angel of Invention",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 2,
  toughness: 1,
  keywords: ["flying", "vigilance", "lifelink"],
  text: `Flying, vigilance, lifelink\n${FABRICATE_TEXT}\n${ANTHEM_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Put two +1/+1 counters on this creature.",
            effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
          },
          {
            text: "Create two 1/1 colorless Servo artifact creature tokens.",
            effect: { kind: "create-token", token: "Servo Token", count: 2 },
          },
        ],
      },
      resolve: null,
      text: FABRICATE_TEXT,
    },
  ],
});

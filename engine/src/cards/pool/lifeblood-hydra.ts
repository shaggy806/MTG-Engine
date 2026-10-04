import { defineCard } from "../define.js";

// EDHREC rank 3024.
//
// Rulings:
//   [2014-11-07] Use Lifeblood Hydra's power when it died (including any +1/+1 counters it had) to
//     determine how much life to gain and how many cards to draw.
//
// `powerOf: "source"` from its own dies trigger reads the power it died with (Elenda's shape).
const ENTER_TEXT = "This creature enters with X +1/+1 counters on it.";
const DIES_TEXT = "When this creature dies, you gain life and draw cards equal to its power.";

export default defineCard({
  name: "Lifeblood Hydra",
  manaCost: "{X}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text: `Trample\n${ENTER_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: { powerOf: "source" } },
          { kind: "draw", amount: { powerOf: "source" } },
        ],
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});

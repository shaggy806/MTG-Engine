import { defineCard } from "../define.js";

// EDHREC rank 4006.

// "You may tap or untap target permanent": the target is chosen as it
// triggers; tap, untap or neither is chosen on resolution — Derevi's `modal`
// of zero or one of the two.
const CAST_TEXT = "Whenever you cast a Merfolk spell, you may tap or untap target permanent.";

export default defineCard({
  name: "Merrow Reejerey",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Soldier"],
  power: 2,
  toughness: 2,
  text: `Other Merfolk creatures you control get +1/+1.\n${CAST_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Merfolk" } },
      targets: ["permanent"],
      effect: {
        kind: "modal",
        minModes: 0,
        maxModes: 1,
        modes: [
          { text: "Tap that permanent.", effect: { kind: "tap", target: 0 } },
          { text: "Untap that permanent.", effect: { kind: "untap", target: 0 } },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Merfolk" },
      grantPt: [1, 1],
      text: "Other Merfolk creatures you control get +1/+1.",
    },
  ],
});

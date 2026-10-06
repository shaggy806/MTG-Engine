import { defineCard } from "../define.js";
import { investigate } from "../helpers.js";

// Rulings:
//   [2024-02-02] If you control multiple Merchants of Truth, Clues you control will have multiple
//     instances of exalted.
//   [2024-02-02] If Merchant of Truth dies at the same time as one or more other nontoken
//     creatures you control, its second ability will trigger for each of those creatures.

const DIES_TEXT = "Whenever a nontoken creature you control dies, investigate.";
const EXALTED_TEXT =
  "Clues you control have exalted. (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn for each instance of exalted among permanents you control.)";

// Exalted is Qasali Pridemage's "attacks-alone" trigger (rule 702.83); each
// Clue carries its own instance, so each triggers separately — Rammas
// Echor's grant, here a static over the Clues (an artifact type, not only
// tokens — the ruling).
export default defineCard({
  name: "Merchant of Truth",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel", "Detective"],
  power: 2,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${DIES_TEXT}\n${EXALTED_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Clue", controlledBy: "you" } },
      grantsTriggered: [
        {
          trigger: { on: "attacks-alone", who: "you-control" },
          targets: [],
          effect: { kind: "modify-pt", target: "trigger-object", power: 1, toughness: 1, duration: "end-of-turn" },
          resolve: null,
          text: "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)",
        },
      ],
      text: EXALTED_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", token: false } },
      targets: [],
      effect: investigate(),
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});

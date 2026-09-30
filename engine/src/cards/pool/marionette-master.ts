import { defineCard } from "../define.js";

const FABRICATE_TEXT =
  "Fabricate 3 (When this creature enters, put three +1/+1 counters on it or create three 1/1 colorless Servo artifact creature tokens.)";
const DRAIN_TEXT =
  "Whenever an artifact you control is put into a graveyard from the battlefield, target opponent loses life equal to this creature's power.";

// Fabricate 3 (rule 702.123) is chosen as it resolves, like Marionette
// Apprentice's. The power is read as the trigger resolves, as it last
// existed if it has left (its ruling) — so it sees its own death alongside
// an artifact's.
export default defineCard({
  name: "Marionette Master",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 3,
  text: `${FABRICATE_TEXT}\n${DRAIN_TEXT}`,
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
            text: "Put three +1/+1 counters on this creature.",
            effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
          },
          {
            text: "Create three 1/1 colorless Servo artifact creature tokens.",
            effect: { kind: "create-token", token: "Servo Token", count: 3 },
          },
        ],
      },
      resolve: null,
      text: FABRICATE_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "artifact" } },
      targets: ["opponent"],
      effect: { kind: "lose-life", amount: { powerOf: "source" }, target: 0 },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});

import { defineCard } from "../define.js";

// #416 in top-commanders.txt.
//
// The Mutant type lasts for as long as the creature stays on the
// battlefield. The draw reads the Mutant's power as it last existed.
const COMBAT_TEXT =
  "At the beginning of combat on your turn, put a number of +1/+1 counters equal to Jenova's power on " +
  "up to one other target creature. That creature becomes a Mutant in addition to its other types.";
const DIES_TEXT = "Whenever a Mutant you control dies during your turn, you draw cards equal to its power.";

export default defineCard({
  name: "Jenova, Ancient Calamity",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Alien"],
  power: 1,
  toughness: 5,
  text: `${COMBAT_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "optional", of: { kind: "other", of: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: { powerOf: "source" } },
          { kind: "add-types", target: 0, addSubtypes: ["Mutant"], duration: "permanent" },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", subtype: "Mutant" } },
      condition: { kind: "your-turn" },
      targets: [],
      effect: { kind: "draw", amount: { powerOf: "trigger-object" } },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});

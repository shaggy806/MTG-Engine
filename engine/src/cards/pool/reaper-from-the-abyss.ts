import { defineCard } from "../define.js";

// EDHREC rank 5787.
//
// Rulings:
//   [2011-09-22] The morbid ability is mandatory. If you control the only non-Demon creature when
//     the ability triggers, you must choose it as the target.

export default defineCard({
  name: "Reaper from the Abyss",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nMorbid — At the beginning of each end step, if a creature died this turn, destroy target non-Demon creature.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "creature-died-this-turn" },
      targets: [{ kind: "permanent", filter: { type: "creature", notSubtypes: ["Demon"] } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "Morbid — At the beginning of each end step, if a creature died this turn, destroy target non-Demon creature.",
    },
  ],
});

import { defineCard } from "../define.js";

// EDHREC rank 4832.

export default defineCard({
  name: "Villainous Wrath",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target opponent loses life equal to the number of creatures they control. Then destroy all creatures.",
  targets: ["opponent"],
  effect: {
    kind: "sequence",
    effects: [
      // Counted from the target's side (Will of the Mardu's `forTarget`),
      // before anything is destroyed.
      {
        kind: "lose-life",
        target: 0,
        amount: { countOf: { type: "creature", controlledBy: "you" }, forTarget: 0 },
      },
      { kind: "destroy-all", filter: { type: "creature" } },
    ],
  },
});

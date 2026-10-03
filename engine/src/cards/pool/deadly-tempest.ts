import { defineCard } from "../define.js";

// "Destroyed this way" is the `destroyed` record: an indestructible or
// regenerated creature wasn't, and costs its controller nothing. Each player
// is charged for the creatures they controlled as those left (a stolen
// creature counts against the thief).
export default defineCard({
  name: "Deadly Tempest",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Destroy all creatures. Each player loses life equal to the number of creatures they controlled that were destroyed this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" } },
      {
        kind: "lose-life",
        who: "each-player",
        amount: { thisWay: "destroyed", who: "each" },
      },
    ],
  },
});

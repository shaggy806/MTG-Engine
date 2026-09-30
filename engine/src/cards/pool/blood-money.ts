import { defineCard } from "../define.js";

// Only nontoken creatures actually destroyed count: an indestructible one
// or one that regenerated wasn't (the `destroyed` this-way record).
export default defineCard({
  name: "Blood Money",
  manaCost: "{5}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Destroy all creatures. For each nontoken creature destroyed this way, you create a tapped Treasure token.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" } },
      {
        kind: "create-token",
        token: "Treasure Token",
        count: { thisWay: "destroyed", filter: { token: false } },
        tapped: true,
      },
    ],
  },
});

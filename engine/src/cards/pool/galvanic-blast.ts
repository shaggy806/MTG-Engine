import { defineCard } from "../define.js";

// EDHREC rank 4703.

// Metalcraft is checked as it resolves ("instead if"), Stubborn Denial's
// `conditional` shape.
export default defineCard({
  name: "Galvanic Blast",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Galvanic Blast deals 2 damage to any target.\nMetalcraft — Galvanic Blast deals 4 damage instead if you control three or more artifacts.",
  targets: ["any-target"],
  effect: {
    kind: "conditional",
    condition: { kind: "metalcraft" },
    then: { kind: "damage", amount: 4, target: 0 },
    else: { kind: "damage", amount: 2, target: 0 },
  },
});

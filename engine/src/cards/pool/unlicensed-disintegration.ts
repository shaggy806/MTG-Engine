import { defineCard } from "../define.js";

// Destroy first, then the artifact rider — the printed order, so the damage
// reads the creature's controller as last-known information (rule 608.2h).
export default defineCard({
  name: "Unlicensed Disintegration",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text:
    "Destroy target creature. If you control an artifact, Unlicensed " +
    "Disintegration deals 3 damage to that creature's controller.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 1 },
        then: { kind: "damage", amount: 3, toControllerOfTarget: 0 },
      },
    ],
  },
});

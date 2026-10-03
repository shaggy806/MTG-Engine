import { defineCard } from "../define.js";

// The creature is the source of the damage, not the spell — a white one can
// hurt a creature with protection from red (the ruling) — and deals its
// power as the spell resolves, to every other creature and each opponent at
// once. If it's an illegal target by then, nothing happens at all (the
// ruling; rule 608.2b).
const TEXT = "Target creature you control deals damage equal to its power to each other creature and each opponent.";

export default defineCard({
  name: "Chandra's Ignition",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: TEXT,
  targets: ["creature-you-control"],
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      {
        kind: "damage-all",
        filter: { type: "creature" },
        amount: { powerOf: 0 },
        exceptSource: true,
        from: { target: 0 },
      },
      { kind: "damage", who: "each-opponent", amount: { powerOf: 0 }, from: { target: 0 } },
    ],
  },
});

import { defineCard } from "../define.js";

// EDHREC rank 2665.

// One instruction: each opponent and their creatures are dealt it together
// (Delayed Blast Fireball's shape).
export default defineCard({
  name: "Tectonic Hazard",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Tectonic Hazard deals 1 damage to each opponent and each creature they control.",
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "damage", amount: 1, who: "each-opponent" },
      { kind: "damage-all", filter: { type: "creature" }, whose: "each-opponent", amount: 1 },
    ],
  },
});

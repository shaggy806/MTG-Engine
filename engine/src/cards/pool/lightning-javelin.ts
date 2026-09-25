import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Javelin",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Lightning Javelin deals 3 damage to any target. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "scry", amount: 1 }],
  },
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Bolt of Keranos",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Bolt of Keranos deals 3 damage to any target. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "scry", amount: 1 }],
  },
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Spark Jolt",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Spark Jolt deals 1 damage to any target. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 1, target: 0 }, { kind: "scry", amount: 1 }],
  },
});

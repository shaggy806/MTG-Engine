import { defineCard } from "../define.js";

export default defineCard({
  name: "Fateful End",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Fateful End deals 3 damage to any target. Scry 1.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "scry", amount: 1 }],
  },
});

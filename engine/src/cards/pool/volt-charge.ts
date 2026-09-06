import { defineCard } from "../define.js";

export default defineCard({
  name: "Volt Charge",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Volt Charge deals 3 damage to any target. Proliferate.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "proliferate" }],
  },
});

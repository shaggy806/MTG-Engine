import { defineCard } from "../define.js";

export default defineCard({
  name: "Jaya's Greeting",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Jaya's Greeting deals 3 damage to target creature. Scry 1.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "scry", amount: 1 }],
  },
});

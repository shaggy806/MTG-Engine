import { defineCard } from "../define.js";

export default defineCard({
  name: "Into the Maw of Hell",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy target land. Into the Maw of Hell deals 13 damage to target creature.",
  targets: ["land", "creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "damage", amount: 13, target: 1 }],
  },
});

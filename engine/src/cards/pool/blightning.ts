import { defineCard } from "../define.js";

export default defineCard({
  name: "Blightning",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  types: ["sorcery"],
  text: "Blightning deals 3 damage to target player and that player discards two cards.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 3, target: 0 },
      { kind: "discard", target: 0, amount: 2 },
    ],
  },
});

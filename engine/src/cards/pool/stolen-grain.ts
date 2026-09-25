import { defineCard } from "../define.js";

export default defineCard({
  name: "Stolen Grain",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Stolen Grain deals 5 damage to target opponent or planeswalker. You gain 5 life.",
  targets: ["opponent-or-planeswalker"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 5, target: 0 }, { kind: "gain-life", amount: 5 }],
  },
});

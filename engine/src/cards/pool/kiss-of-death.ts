import { defineCard } from "../define.js";

export default defineCard({
  name: "Kiss of Death",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Kiss of Death deals 4 damage to target opponent or planeswalker. You gain 4 life.",
  targets: ["opponent-or-planeswalker"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 4, target: 0 }, { kind: "gain-life", amount: 4 }],
  },
});

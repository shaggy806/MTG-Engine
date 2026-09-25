import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul Shred",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Soul Shred deals 3 damage to target nonblack creature. You gain 3 life.",
  targets: ["nonblack-creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "gain-life", amount: 3 }],
  },
});

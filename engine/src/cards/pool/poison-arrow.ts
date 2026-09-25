import { defineCard } from "../define.js";

export default defineCard({
  name: "Poison Arrow",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target nonblack creature. You gain 3 life.",
  targets: ["nonblack-creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 3 }],
  },
});

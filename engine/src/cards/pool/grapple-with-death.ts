import { defineCard } from "../define.js";

export default defineCard({
  name: "Grapple with Death",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text: "Destroy target artifact or creature. You gain 1 life.",
  targets: ["artifact-or-creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 1 }],
  },
});

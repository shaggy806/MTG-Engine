import { defineCard } from "../define.js";

export default defineCard({
  name: "Maw of the Mire",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target land. You gain 4 life.",
  targets: ["land"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 4 }],
  },
});

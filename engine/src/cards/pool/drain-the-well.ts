import { defineCard } from "../define.js";

export default defineCard({
  name: "Drain the Well",
  manaCost: "{2}{B/G}{B/G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text: "Destroy target land. You gain 2 life.",
  targets: ["land"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 2 }],
  },
});

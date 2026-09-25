import { defineCard } from "../define.js";

export default defineCard({
  name: "Sephiroth's Intervention",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature. You gain 2 life.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "gain-life", amount: 2 }],
  },
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Winter's Intervention",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Winter's Intervention deals 2 damage to target creature. You gain 2 life.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 2, target: 0 }, { kind: "gain-life", amount: 2 }],
  },
});

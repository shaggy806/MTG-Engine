import { defineCard } from "../define.js";

export default defineCard({
  name: "Dark Nourishment",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Dark Nourishment deals 3 damage to any target. You gain 3 life.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "gain-life", amount: 3 }],
  },
});

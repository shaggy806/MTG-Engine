import { defineCard } from "../define.js";

export default defineCard({
  name: "Joust Through",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Joust Through deals 3 damage to target attacking or blocking creature. You gain 1 life.",
  targets: ["attacking-or-blocking-creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "gain-life", amount: 1 }],
  },
});

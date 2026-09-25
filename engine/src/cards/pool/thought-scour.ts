import { defineCard } from "../define.js";

export default defineCard({
  name: "Thought Scour",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target player mills two cards.\nDraw a card.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "mill", target: 0, amount: 2 }, { kind: "draw", amount: 1 }],
  },
});

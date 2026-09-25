import { defineCard } from "../define.js";

export default defineCard({
  name: "Zap",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Zap deals 1 damage to any target.\nDraw a card.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 1, target: 0 }, { kind: "draw", amount: 1 }],
  },
});

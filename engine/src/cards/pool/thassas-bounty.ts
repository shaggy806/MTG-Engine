import { defineCard } from "../define.js";

export default defineCard({
  name: "Thassa's Bounty",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw three cards. Target player mills three cards.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 3 }, { kind: "mill", target: 0, amount: 3 }],
  },
});

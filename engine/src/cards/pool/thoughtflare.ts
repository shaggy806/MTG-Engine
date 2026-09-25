import { defineCard } from "../define.js";

export default defineCard({
  name: "Thoughtflare",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: "Draw four cards, then discard two cards.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 4 }, { kind: "discard", target: "you", amount: 2 }],
  },
});

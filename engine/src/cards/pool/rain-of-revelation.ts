import { defineCard } from "../define.js";

export default defineCard({
  name: "Rain of Revelation",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw three cards, then discard a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 3 }, { kind: "discard", target: "you", amount: 1 }],
  },
});

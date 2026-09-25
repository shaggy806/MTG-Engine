import { defineCard } from "../define.js";

export default defineCard({
  name: "Enhanced Awareness",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw three cards, then discard a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 3 }, { kind: "discard", target: "you", amount: 1 }],
  },
});

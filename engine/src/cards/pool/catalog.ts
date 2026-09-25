import { defineCard } from "../define.js";

export default defineCard({
  name: "Catalog",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw two cards, then discard a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
  },
});

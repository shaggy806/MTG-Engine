import { defineCard } from "../define.js";

export default defineCard({
  name: "Pull from Tomorrow",
  manaCost: "{X}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw X cards, then discard a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: "x" }, { kind: "discard", target: "you", amount: 1 }],
  },
});

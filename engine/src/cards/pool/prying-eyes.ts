import { defineCard } from "../define.js";

export default defineCard({
  name: "Prying Eyes",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw four cards, then discard two cards.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 4 }, { kind: "discard", target: "you", amount: 2 }],
  },
});

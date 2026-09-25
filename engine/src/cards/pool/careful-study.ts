import { defineCard } from "../define.js";

export default defineCard({
  name: "Careful Study",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw two cards, then discard two cards.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 2 }],
  },
});

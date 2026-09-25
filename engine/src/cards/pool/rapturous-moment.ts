import { defineCard } from "../define.js";

export default defineCard({
  name: "Rapturous Moment",
  manaCost: "{4}{U}{R}",
  colors: ["U", "R"],
  types: ["sorcery"],
  text: "Draw three cards, then discard two cards. Add {U}{U}{R}{R}{R}.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 3 }, { kind: "discard", target: "you", amount: 2 }],
      },
      { kind: "add-mana", mana: { all: ["U", "U", "R", "R", "R"] }, amount: 1 },
    ],
  },
});

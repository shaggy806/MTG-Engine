import { defineCard } from "../define.js";

export default defineCard({
  name: "Tezzeret's Gambit",
  manaCost: "{3}{U/P}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "({U/P} can be paid with either {U} or 2 life.)\n" +
    "Draw two cards, then proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 2 }, { kind: "proliferate" }],
  },
});

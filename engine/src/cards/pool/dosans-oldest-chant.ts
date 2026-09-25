import { defineCard } from "../define.js";

export default defineCard({
  name: "Dosan's Oldest Chant",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "You gain 6 life.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "gain-life", amount: 6 }, { kind: "draw", amount: 1 }],
  },
});

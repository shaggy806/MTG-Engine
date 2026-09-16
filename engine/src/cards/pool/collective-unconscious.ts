import { defineCard } from "../define.js";

export default defineCard({
  name: "Collective Unconscious",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Draw a card for each creature you control.",
  effect: {
    kind: "draw",
    amount: { countOf: { type: "creature", controlledBy: "you" } },
  },
});

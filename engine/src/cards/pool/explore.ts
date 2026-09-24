import { defineCard } from "../define.js";

export default defineCard({
  name: "Explore",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "You may play an additional land this turn.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "additional-land-drop", amount: 1 },
      { kind: "draw", amount: 1 },
    ],
  },
});

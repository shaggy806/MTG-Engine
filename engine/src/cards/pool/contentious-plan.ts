import { defineCard } from "../define.js";

export default defineCard({
  name: "Contentious Plan",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Proliferate.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "proliferate" }, { kind: "draw", amount: 1 }],
  },
});

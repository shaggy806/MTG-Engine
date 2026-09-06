import { defineCard } from "../define.js";

export default defineCard({
  name: "Contentious Plan",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw a card. Proliferate.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 1 }, { kind: "proliferate" }],
  },
});

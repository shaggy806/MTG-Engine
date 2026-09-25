import { defineCard } from "../define.js";

export default defineCard({
  name: "Cloak of Feathers",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target creature gains flying until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});

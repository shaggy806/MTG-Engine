import { defineCard } from "../define.js";

export default defineCard({
  name: "Crash Through",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Creatures you control gain trample until end of turn. (Each of those creatures can deal excess combat damage to the player or planeswalker it's attacking.)\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "trample",
        duration: "end-of-turn",
      },
      { kind: "draw", amount: 1 },
    ],
  },
});

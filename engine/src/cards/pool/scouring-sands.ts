import { defineCard } from "../define.js";

export default defineCard({
  name: "Scouring Sands",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Scouring Sands deals 1 damage to each creature your opponents control. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage-all", amount: 1, filter: { type: "creature", controlledBy: "opponent" } },
      { kind: "scry", amount: 1 },
    ],
  },
});

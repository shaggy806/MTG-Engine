import { defineCard } from "../define.js";

export default defineCard({
  name: "Warlord's Fury",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Creatures you control gain first strike until end of turn.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "first-strike",
        duration: "end-of-turn",
      },
      { kind: "draw", amount: 1 },
    ],
  },
});

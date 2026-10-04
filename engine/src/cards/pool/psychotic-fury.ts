import { defineCard } from "../define.js";

// EDHREC rank 4664.

export default defineCard({
  name: "Psychotic Fury",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target multicolored creature gains double strike until end of turn.\nDraw a card.",
  targets: [{ kind: "permanent", filter: { type: "creature", multicolored: true } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});

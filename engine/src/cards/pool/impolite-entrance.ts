import { defineCard } from "../define.js";

export default defineCard({
  name: "Impolite Entrance",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Target creature gains trample and haste until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      { kind: "draw", amount: 1 },
    ],
  },
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Expedite",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gains haste until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});

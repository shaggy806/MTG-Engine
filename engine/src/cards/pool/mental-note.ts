import { defineCard } from "../define.js";

export default defineCard({
  name: "Mental Note",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Mill two cards.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "mill", target: "you", amount: 2 }, { kind: "draw", amount: 1 }],
  },
});

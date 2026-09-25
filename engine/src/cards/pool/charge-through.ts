import { defineCard } from "../define.js";

export default defineCard({
  name: "Charge Through",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gains trample until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});

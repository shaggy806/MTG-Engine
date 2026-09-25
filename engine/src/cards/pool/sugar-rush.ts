import { defineCard } from "../define.js";

export default defineCard({
  name: "Sugar Rush",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets +3/+0 until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 0, duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});

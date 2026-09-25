import { defineCard } from "../define.js";

export default defineCard({
  name: "Sudden Strength",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gets +3/+3 until end of turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});

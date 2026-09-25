import { defineCard } from "../define.js";

export default defineCard({
  name: "Hithlain Knots",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Tap target creature. Scry 1.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "tap", target: 0 }, { kind: "scry", amount: 1 }, { kind: "draw", amount: 1 }],
  },
});

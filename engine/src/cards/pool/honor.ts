import { defineCard } from "../define.js";

export default defineCard({
  name: "Honor",
  manaCost: "{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Put a +1/+1 counter on target creature.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      { kind: "draw", amount: 1 },
    ],
  },
});

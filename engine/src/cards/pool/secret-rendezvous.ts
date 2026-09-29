import { defineCard } from "../define.js";

export default defineCard({
  name: "Secret Rendezvous",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "You and target opponent each draw three cards.",
  targets: ["opponent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "draw", amount: 3, target: 0 },
    ],
  },
});

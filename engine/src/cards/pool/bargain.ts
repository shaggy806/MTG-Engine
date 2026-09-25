import { defineCard } from "../define.js";

export default defineCard({
  name: "Bargain",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Target opponent draws a card.\nYou gain 7 life.",
  targets: ["opponent"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 1, target: 0 }, { kind: "gain-life", amount: 7 }],
  },
});

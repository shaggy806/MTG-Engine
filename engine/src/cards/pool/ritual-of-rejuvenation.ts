import { defineCard } from "../define.js";

export default defineCard({
  name: "Ritual of Rejuvenation",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "You gain 4 life.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "gain-life", amount: 4 }, { kind: "draw", amount: 1 }],
  },
});

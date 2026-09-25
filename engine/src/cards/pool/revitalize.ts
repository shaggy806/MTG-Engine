import { defineCard } from "../define.js";

export default defineCard({
  name: "Revitalize",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "You gain 3 life.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [{ kind: "gain-life", amount: 3 }, { kind: "draw", amount: 1 }],
  },
});

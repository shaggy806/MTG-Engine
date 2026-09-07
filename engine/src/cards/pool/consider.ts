import { defineCard } from "../define.js";

export default defineCard({
  name: "Consider",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Look at the top card of your library. You may put that card into your graveyard. Then draw a card.",
  effect: { kind: "surveil", amount: 1, then: { kind: "draw", amount: 1 } },
});

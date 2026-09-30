import { defineCard } from "../define.js";

export default defineCard({
  name: "Laughing Mad",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, discard a card.\nDraw two cards.\n" +
    "Flashback {3}{R} (You may cast this card from your graveyard for its flashback cost and any additional costs. Then exile it.)",
  additionalCost: { discard: 1 },
  flashback: { cost: "{3}{R}" },
  effect: { kind: "draw", amount: 2 },
});

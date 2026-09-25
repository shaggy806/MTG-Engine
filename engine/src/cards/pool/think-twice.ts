import { defineCard } from "../define.js";

export default defineCard({
  name: "Think Twice",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  flashback: { cost: "{2}{U}" },
  text: "Draw a card.\nFlashback {2}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "draw", amount: 1 },
});

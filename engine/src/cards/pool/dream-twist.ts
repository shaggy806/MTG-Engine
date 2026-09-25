import { defineCard } from "../define.js";

export default defineCard({
  name: "Dream Twist",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  flashback: { cost: "{1}{U}" },
  text: "Target player mills three cards.\nFlashback {1}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: 3 },
});

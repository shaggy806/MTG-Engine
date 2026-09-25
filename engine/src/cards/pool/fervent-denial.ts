import { defineCard } from "../define.js";

export default defineCard({
  name: "Fervent Denial",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  flashback: { cost: "{5}{U}{U}" },
  text: "Counter target spell.\nFlashback {5}{U}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["spell"],
  effect: { kind: "counter", target: 0 },
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Bash to Bits",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  flashback: { cost: "{4}{R}{R}" },
  text: "Destroy target artifact.\nFlashback {4}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});

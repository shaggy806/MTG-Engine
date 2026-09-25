import { defineCard } from "../define.js";

export default defineCard({
  name: "Ray of Distortion",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["instant"],
  flashback: { cost: "{4}{W}{W}" },
  text: "Destroy target artifact or enchantment.\nFlashback {4}{W}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
});

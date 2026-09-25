import { defineCard } from "../define.js";

export default defineCard({
  name: "Ray of Revelation",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  flashback: { cost: "{G}" },
  text: "Destroy target enchantment.\nFlashback {G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["enchantment"],
  effect: { kind: "destroy", target: 0 },
});

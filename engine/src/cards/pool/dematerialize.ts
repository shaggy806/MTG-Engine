import { defineCard } from "../define.js";

export default defineCard({
  name: "Dematerialize",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  flashback: { cost: "{5}{U}{U}" },
  text: "Return target permanent to its owner's hand.\nFlashback {5}{U}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["permanent"],
  effect: { kind: "return-to-hand", target: 0 },
});

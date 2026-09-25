import { defineCard } from "../define.js";

export default defineCard({
  name: "Skull Fracture",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{3}{B}" },
  text: "Target player discards a card.\nFlashback {3}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["player"],
  effect: { kind: "discard", target: 0, amount: 1 },
});

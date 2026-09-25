import { defineCard } from "../define.js";

export default defineCard({
  name: "Silent Departure",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  flashback: { cost: "{4}{U}" },
  text: "Return target creature to its owner's hand.\nFlashback {4}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["creature"],
  effect: { kind: "return-to-hand", target: 0 },
});

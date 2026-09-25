import { defineCard } from "../define.js";

export default defineCard({
  name: "Earth Rift",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{5}{R}{R}" },
  text: "Destroy target land.\nFlashback {5}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["land"],
  effect: { kind: "destroy", target: 0 },
});

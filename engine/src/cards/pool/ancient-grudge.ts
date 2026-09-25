import { defineCard } from "../define.js";

export default defineCard({
  name: "Ancient Grudge",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  flashback: { cost: "{G}" },
  text: "Destroy target artifact.\nFlashback {G} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Strike It Rich",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{2}{R}" },
  text: "Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\nFlashback {2}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  effect: { kind: "create-token", token: "Treasure Token", count: 1 },
});

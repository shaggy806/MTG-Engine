import { defineCard } from "../define.js";

export default defineCard({
  name: "Firebolt",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{4}{R}" },
  text: "Firebolt deals 2 damage to any target.\nFlashback {4}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 2, target: 0 },
});
